const SellerLead = require('../models/SellerLead');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { HTTP_STATUS } = require('../utils/constants');

class SellerLeadService {
  async getSellerLeads(queryParams = {}, viewer = null) {
    const {
      district,
      type,
      status,
      sort = 'newest',
      page = 1,
      limit = 10,
      search,
    } = queryParams;

    const matchStage = {};

    if (district && district.trim()) {
      matchStage.district = { $regex: escapeRegex(district.trim()), $options: 'i' };
    }

    if (type) matchStage.type = type;
    if (status) matchStage.status = status;

    if (search && search.trim()) {
      const escaped = escapeRegex(search.trim());
      matchStage.$or = [
        { userName: { $regex: escaped, $options: 'i' } },
        { userMobile: { $regex: escaped, $options: 'i' } },
        { userEmail: { $regex: escaped, $options: 'i' } },
        { district: { $regex: escaped, $options: 'i' } },
        { subDistrict: { $regex: escaped, $options: 'i' } },
        { village: { $regex: escaped, $options: 'i' } },
        { additionalDetails: { $regex: escaped, $options: 'i' } },
      ];
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      SellerLead.find(matchStage).sort({ submittedAt: sortOrder }).skip(skip).limit(limitNum),
      SellerLead.countDocuments(matchStage),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      data: leads,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  }

  async getSellerLeadById(id, viewer = null) {
    const lead = await SellerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Seller lead not found');
    }
    return lead;
  }

  async updateSellerLeadStatus(id, status) {
    const lead = await SellerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Seller lead not found');
    }

    lead.status = status;
    await lead.save();
    return lead;
  }

  async deleteSellerLead(id, viewer = null) {
    const lead = await SellerLead.findById(id);
    if (!lead) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Seller lead not found');
    }

    await SellerLead.findByIdAndDelete(id);
    return true;
  }
}

module.exports = new SellerLeadService();
