const BuyerLead = require('../models/BuyerLead');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

const escapeRegex = (str) => (str ? String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

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

    // Mark buyerFormSubmitted flag on User per BACKEND_SPEC.md §7.1
    await User.findByIdAndUpdate(user._id, { buyerFormSubmitted: true });

    // Conditionally create notification if Notification model is available
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: user._id,
        type: 'Requirement submitted',
        message: `New buyer requirement submitted for ${savedLead.district} ${savedLead.propertyType}.`,
        category: 'buyer',
      });
    } catch (e) {
      // Notification model not implemented yet — ignore gracefully
    }

    return savedLead;
  }

  /**
   * Query buyer leads with filtering, search, sorting, and single-facet pagination
   */
  async getBuyerLeads(queryParams = {}, isAdmin = false, currentUserId = null) {
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

    if (currentUserId) {
      matchStage.userId = currentUserId;
    }

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

    const formattedData = rawData.map((item) => ({
      ...item,
      id: item._id.toString(),
    }));

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
  async getBuyerLeadById(id, user = null) {
    const lead = await BuyerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Buyer lead not found');
    }
    if (user) {
      this.assertOwnerOrAdmin(lead, user, 'view');
    }
    return lead;
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

    // Non-admin users cannot update status
    if (user.role !== 'admin') {
      delete updateData.status;
    }

    // Identify replaced media files to clean up after successful DB save
    const removedImages =
      updateData.images && Array.isArray(updateData.images) && lead.images
        ? lead.images.filter((oldUrl) => !updateData.images.includes(oldUrl))
        : [];
    const removedAudioUrl =
      updateData.voiceRecording && lead.voiceRecording && lead.voiceRecording !== updateData.voiceRecording
        ? lead.voiceRecording
        : null;

    Object.assign(lead, updateData);
    await lead.save();

    // Best-effort file cleanup after DB save has succeeded
    const uploadService = require('./upload.service');
    try {
      if (removedImages.length > 0) {
        await uploadService.deleteFiles(removedImages);
      }
      if (removedAudioUrl) {
        await uploadService.deleteFile(removedAudioUrl);
      }
    } catch (cleanupErr) {
      console.warn(`Failed to clean up old files after buyer lead update ${id}:`, cleanupErr.message);
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

    const imagesToDelete = lead.images || [];
    const audioToDelete = lead.voiceRecording || null;

    await BuyerLead.findByIdAndDelete(id);

    // Best-effort file cleanup after DB operation has succeeded
    const uploadService = require('./upload.service');
    try {
      if (imagesToDelete.length > 0) {
        await uploadService.deleteFiles(imagesToDelete);
      }
      if (audioToDelete) {
        await uploadService.deleteFile(audioToDelete);
      }
    } catch (cleanupErr) {
      console.warn(`Failed to clean up files after buyer lead deletion ${id}:`, cleanupErr.message);
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
