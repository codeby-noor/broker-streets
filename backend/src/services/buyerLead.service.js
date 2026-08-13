const BuyerLead = require('../models/BuyerLead');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { HTTP_STATUS } = require('../utils/constants');

class BuyerLeadService {
  /**
   * Asserts that current user is buyer lead owner or admin
   */
  assertOwnerOrAdmin(lead, user, action = 'perform action on') {
    if (user.role !== 'admin' && lead.userId.toString() !== user._id.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, `You are not authorized to ${action} this buyer lead`);
    }
  }

  /**
   * Determines whether a viewer can see full (private) buyer lead details.
   * Only the lead owner or an admin sees direct-contact fields — everyone else
   * sees the sanitized "requirements board" projection.
   */
  isOwnerOrAdmin(lead, user) {
    return user && (user.role === 'admin' || lead.userId.toString() === user._id.toString());
  }

  /**
   * Strips direct-contact fields (mobile/email/voice recording) from a buyer
   * lead when the viewer is neither the owner nor an admin. The list endpoints
   * act as a public "requirements board" for sellers, so contact info must not
   * leak to unrelated users.
   */
  sanitizeForViewer(lead, user) {
    if (this.isOwnerOrAdmin(lead, user)) return lead;

    const sanitized = lead.toObject ? lead.toObject() : { ...lead };
    delete sanitized.userMobile;
    delete sanitized.userEmail;
    delete sanitized.voiceRecording;
    return sanitized;
  }

  /**
   * Create buyer requirement lead and mark buyerFormSubmitted flag on user
   */
  async createBuyerLead(leadData, user) {
    const buyerLead = new BuyerLead({
      ...leadData,
      userId: user._id,
      userName: user.name || '',
      userMobile: user.mobile || '',
      userEmail: user.email || '',
    });

    const savedLead = await buyerLead.save();

    // Best-effort update of buyerFormSubmitted flag on User per BACKEND_SPEC.md §7.1
    try {
      await User.findByIdAndUpdate(user._id, { buyerFormSubmitted: true });
    } catch (err) {
      console.warn(`Failed to update buyerFormSubmitted flag for user ${user._id}:`, err.message);
    }

    // Item 6: Create notification via notification.service helper
    try {
      const notificationService = require('./notification.service');
      await notificationService.createNotification({
        userId: user._id,
        type: 'Requirement submitted',
        message: `New buyer requirement submitted for ${savedLead.district} ${savedLead.propertyType}.`,
        category: 'buyer',
      });
    } catch (e) {
      console.error(`Failed to create notification for buyer lead ${savedLead._id}:`, e.message);
    }

    return savedLead;
  }

  /**
   * Query buyer leads with filtering, search, sorting, and single-facet pagination
   */
  async getBuyerLeads(queryParams = {}, viewer = null) {
    const {
      district,
      propertyType,
      purpose,
      status,
      sort = 'newest',
      page = 1,
      limit = 10,
      search,
    } = queryParams;

    const matchStage = {};

    if (district) {
      matchStage.district = { $regex: escapeRegex(district.trim()), $options: 'i' };
    }

    if (propertyType) matchStage.propertyType = propertyType;
    if (purpose) matchStage.purpose = purpose;
    if (status) matchStage.status = status;

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      matchStage.$or = [
        { district: searchRegex },
        { taluka: searchRegex },
        { preferredVillages: searchRegex },
        { requirements: searchRegex },
        { userName: searchRegex },
      ];
    }

    let sortStage = { createdAt: -1 };
    if (sort === 'oldest') sortStage = { createdAt: 1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const aggregationResult = await BuyerLead.aggregate([
      { $match: matchStage },
      {
        $facet: {
          data: [{ $sort: sortStage }, { $skip: skipNum }, { $limit: limitNum }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const facetResult = aggregationResult[0] || { data: [], totalCount: [] };
    const rawData = facetResult.data || [];
    const total = facetResult.totalCount[0] ? facetResult.totalCount[0].count : 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const formattedData = rawData.map((item) => {
      const doc = {
        ...item,
        id: item._id.toString(),
      };
      delete doc._id;
      delete doc.__v;

      // Requirements board: strip direct-contact fields unless this user
      // owns the lead or is an admin.
      if (!viewer || (viewer.role !== 'admin' && item.userId.toString() !== viewer._id.toString())) {
        delete doc.userMobile;
        delete doc.userEmail;
        delete doc.voiceRecording;
      }
      return doc;
    });

    return {
      data: formattedData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single buyer lead by ID
   */
  async getBuyerLeadById(id, viewer = null) {
    const lead = await BuyerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Buyer lead not found');
    }
    // Public board: anyone authenticated can view a requirement, but only the
    // owner or an admin sees direct-contact fields.
    return this.sanitizeForViewer(lead, viewer);
  }

  /**
   * Get buyer leads created by current user
   */
  async getMyBuyerLeads(userId) {
    return await BuyerLead.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Update buyer lead with ownership check and post-commit file cleanup
   */
  async updateBuyerLead(id, updateData, user) {
    const lead = await BuyerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Buyer lead not found');
    }

    this.assertOwnerOrAdmin(lead, user, 'update');

    // Prevent ownership takeover
    delete updateData.userId;
    delete updateData.userName;
    delete updateData.userMobile;
    delete updateData.userEmail;

    // Identify replaced voice recording to clean up after successful DB save
    const removedAudioUrl =
      updateData.voiceRecording !== undefined &&
      lead.voiceRecording &&
      lead.voiceRecording !== updateData.voiceRecording
        ? lead.voiceRecording
        : null;

    Object.assign(lead, updateData);
    await lead.save();

    // Best-effort file cleanup after DB save has succeeded
    if (removedAudioUrl) {
      const uploadService = require('./upload.service');
      try {
        await uploadService.deleteFile(removedAudioUrl);
      } catch (cleanupErr) {
        console.warn(`Failed to clean up old voice recording after buyer lead update ${id}:`, cleanupErr.message);
      }
    }

    return lead;
  }

  /**
   * Delete buyer lead with ownership check and post-commit file cleanup
   */
  async deleteBuyerLead(id, user) {
    const lead = await BuyerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Buyer lead not found');
    }

    this.assertOwnerOrAdmin(lead, user, 'delete');

    const audioToDelete = lead.voiceRecording || null;

    await BuyerLead.findByIdAndDelete(id);

    // Best-effort file cleanup after DB operation has succeeded
    if (audioToDelete) {
      const uploadService = require('./upload.service');
      try {
        await uploadService.deleteFile(audioToDelete);
      } catch (cleanupErr) {
        console.warn(`Failed to clean up audio file after buyer lead deletion ${id}:`, cleanupErr.message);
      }
    }

    return true;
  }

  /**
   * Update buyer lead status (Admin)
   */
  async updateBuyerLeadStatus(id, status) {
    const lead = await BuyerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Buyer lead not found');
    }

    lead.status = status;
    await lead.save();
    return lead;
  }
}

module.exports = new BuyerLeadService();
