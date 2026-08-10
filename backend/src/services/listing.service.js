const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const SellerLead = require('../models/SellerLead');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const escapeRegex = require('../utils/escapeRegex');
const { HTTP_STATUS } = require('../utils/constants');

class ListingService {
  /**
   * Asserts that current user is listing owner or admin
   */
  assertOwnerOrAdmin(listing, user, action = 'perform action on') {
    if (user.role !== 'admin' && listing.userId.toString() !== user._id.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, `You are not authorized to ${action} this listing`);
    }
  }

  /**
   * Helper to execute operations atomically within a Mongoose transaction, with fallback for standalone DBs
   */
  async runTransaction(operations) {
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      const result = await operations(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (err) {
      if (session) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
      }
      if (
        err.message &&
        (err.message.includes('Transaction numbers are only allowed') ||
          err.message.includes('standalone'))
      ) {
        return await operations(null);
      }
      throw err;
    }
  }

  /**
   * Create property listing and corresponding Seller Lead atomically
   */
  async createListing(listingData, user) {
    const subDistrict = listingData.subDistrict || listingData.taluka || '';

    return await this.runTransaction(async (session) => {
      const sessionOpt = session ? { session } : {};

      const listing = new Listing({
        ...listingData,
        subDistrict,
        userId: user._id,
        ownerName: user.name || '',
        ownerMobile: user.mobile || '',
        ownerEmail: user.email || '',
      });

      const savedListing = await listing.save(sessionOpt);

      // Automatically create a SellerLead record
      const sellerLead = new SellerLead({
        listingId: savedListing._id,
        userId: user._id,
        userName: user.name || '',
        userMobile: user.mobile || '',
        userEmail: user.email || '',
        state: savedListing.state,
        district: savedListing.district,
        subDistrict: savedListing.subDistrict,
        village: savedListing.village,
        type: savedListing.type,
        priceUnit: savedListing.priceUnit,
        priceAmount: savedListing.priceAmount,
        mapLink: savedListing.mapLink,
        additionalDetails: savedListing.additionalDetails,
        propertyImages: savedListing.images,
        propertyVideos: savedListing.videos,
        propertyDocument: savedListing.propertyDocument,
        status: 'New',
      });

      await sellerLead.save(sessionOpt);

      // Mark sellerFormSubmitted flag on User per BACKEND_SPEC.md §7.1
      await User.findByIdAndUpdate(user._id, { sellerFormSubmitted: true }, sessionOpt);

      return savedListing;
    });
  }

  /**
   * Query listings with filtering, escaped regex search, sorting, and single-facet pagination
   */
  async getListings(queryParams = {}, isAdmin = false) {
    const {
      district,
      subDistrict,
      taluka,
      village,
      type,
      minPrice,
      maxPrice,
      status,
      sort = 'newest',
      page = 1,
      limit = 10,
      search,
      verified,
      featured,
    } = queryParams;

    const matchStage = {};

    if (!isAdmin) {
      matchStage.status = status || 'Available';
    } else if (status) {
      matchStage.status = status;
    }

    if (type) matchStage.type = type;

    if (district) {
      matchStage.district = { $regex: escapeRegex(district.trim()), $options: 'i' };
    }

    const targetSubDistrict = subDistrict || taluka;
    if (targetSubDistrict) {
      matchStage.subDistrict = { $regex: escapeRegex(targetSubDistrict.trim()), $options: 'i' };
    }

    if (village) {
      matchStage.village = { $regex: escapeRegex(village.trim()), $options: 'i' };
    }

    if (verified !== undefined) matchStage.verified = verified === 'true' || verified === true;
    if (featured !== undefined) matchStage.featured = featured === 'true' || featured === true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      matchStage.priceAmount = {};
      if (minPrice !== undefined) matchStage.priceAmount.$gte = Number(minPrice);
      if (maxPrice !== undefined) matchStage.priceAmount.$lte = Number(maxPrice);
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      matchStage.$or = [
        { title: searchRegex },
        { district: searchRegex },
        { subDistrict: searchRegex },
        { village: searchRegex },
        { additionalDetails: searchRegex },
      ];
    }

    let sortStage = { createdAt: -1 };
    if (sort === 'oldest') sortStage = { createdAt: 1 };
    if (sort === 'price_asc') sortStage = { priceAmount: 1 };
    if (sort === 'price_desc') sortStage = { priceAmount: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Execute combined query & total count using $facet in single round-trip
    const aggregationResult = await Listing.aggregate([
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
   * Get single property listing by ID
   */
  async getListingById(id) {
    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }
    return listing;
  }

  /**
   * Update listing details (owner or admin) with ownership protection & role-gated fields
   */
  async updateListing(id, updateData, user) {
    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }

    this.assertOwnerOrAdmin(listing, user, 'update');

    // Defensively strip ownership and denormalised fields to prevent takeover
    delete updateData.userId;
    delete updateData.ownerName;
    delete updateData.ownerMobile;
    delete updateData.ownerEmail;

    // Non-admin users cannot update role-protected fields (verified/featured)
    if (user.role !== 'admin') {
      delete updateData.verified;
      delete updateData.featured;
    }

    if (updateData.taluka && !updateData.subDistrict) {
      updateData.subDistrict = updateData.taluka;
    }

    // Identify replaced files to clean up after successful DB save
    const removedImages =
      updateData.images && Array.isArray(updateData.images) && listing.images
        ? listing.images.filter((oldUrl) => !updateData.images.includes(oldUrl))
        : [];
    const removedVideos =
      updateData.videos && Array.isArray(updateData.videos) && listing.videos
        ? listing.videos.filter((oldUrl) => !updateData.videos.includes(oldUrl))
        : [];
    const removedDocUrl =
      updateData.propertyDocument && listing.propertyDocument && listing.propertyDocument.url && listing.propertyDocument.url !== updateData.propertyDocument.url
        ? listing.propertyDocument.url
        : null;

    Object.assign(listing, updateData);
    await listing.save();

    // Best-effort file cleanup after DB save has succeeded
    const uploadService = require('./upload.service');
    try {
      if (removedImages.length > 0) {
        await uploadService.deleteFiles(removedImages);
      }
      if (removedVideos.length > 0) {
        await uploadService.deleteFiles(removedVideos);
      }
      if (removedDocUrl) {
        await uploadService.deleteFile(removedDocUrl);
      }
    } catch (cleanupErr) {
      console.warn(`Failed to clean up old files after listing update ${id}:`, cleanupErr.message);
    }

    return listing;
  }

  /**
   * Update property status (Available/Pending/Sold)
   */
  async updateListingStatus(id, status, user) {
    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }

    this.assertOwnerOrAdmin(listing, user, 'update status of');

    listing.status = status;
    await listing.save();
    return listing;
  }

  /**
   * Delete listing and associated seller leads atomically
   */
  async deleteListing(id, user) {
    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }

    this.assertOwnerOrAdmin(listing, user, 'delete');

    const imagesToDelete = listing.images || [];
    const videosToDelete = listing.videos || [];
    const docToDelete = listing.propertyDocument?.url || null;

    const result = await this.runTransaction(async (session) => {
      const sessionOpt = session ? { session } : {};
      await Listing.findByIdAndDelete(id, sessionOpt);
      await SellerLead.deleteMany({ listingId: id }, sessionOpt);
      return true;
    });

    // Best-effort file cleanup after DB transaction has succeeded
    const uploadService = require('./upload.service');
    try {
      if (imagesToDelete.length > 0) {
        await uploadService.deleteFiles(imagesToDelete);
      }
      if (videosToDelete.length > 0) {
        await uploadService.deleteFiles(videosToDelete);
      }
      if (docToDelete) {
        await uploadService.deleteFile(docToDelete);
      }
    } catch (cleanupErr) {
      console.warn(`Failed to clean up files after listing deletion ${id}:`, cleanupErr.message);
    }

    return result;
  }

  /**
   * Duplicate existing listing, resetting verified/featured flags and status
   */
  async duplicateListing(id, user) {
    const original = await Listing.findById(id);
    if (!original) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }

    this.assertOwnerOrAdmin(original, user, 'duplicate');

    const listingObj = original.toObject();
    delete listingObj._id;
    delete listingObj.id;
    delete listingObj.createdAt;
    delete listingObj.updatedAt;

    listingObj.title = `${original.title} (Copy)`;
    listingObj.userId = user._id;
    listingObj.verified = false;
    listingObj.featured = false;
    listingObj.status = 'Available';

    // Copy underlying media files so original and copy don't share file references
    const uploadService = require('./upload.service');
    if (listingObj.images && listingObj.images.length > 0) {
      listingObj.images = await uploadService.copyFiles(listingObj.images, 'properties');
    }
    if (listingObj.videos && listingObj.videos.length > 0) {
      listingObj.videos = await uploadService.copyFiles(listingObj.videos, 'videos');
    }
    if (listingObj.propertyDocument && listingObj.propertyDocument.url) {
      const newDocUrl = await uploadService.copyFile(listingObj.propertyDocument.url, 'documents');
      listingObj.propertyDocument = {
        ...listingObj.propertyDocument,
        url: newDocUrl,
      };
    }

    const duplicate = new Listing(listingObj);
    await duplicate.save();
    return duplicate;
  }

  /**
   * Get similar listings in same district and type (max 4) using lean projection
   */
  async getSimilarListings(id) {
    const current = await Listing.findById(id).select('type district').lean();
    if (!current) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }

    const similar = await Listing.find({
      _id: { $ne: current._id },
      type: current.type,
      district: current.district,
      status: 'Available',
    })
      .limit(4)
      .sort({ createdAt: -1 });

    return similar;
  }

  /**
   * Toggle featured flag (Admin)
   */
  async toggleFeatured(id, featured) {
    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }

    listing.featured = featured;
    await listing.save();
    return listing;
  }

  /**
   * Toggle verified flag (Admin)
   */
  async toggleVerified(id, verified) {
    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Property listing not found');
    }

    listing.verified = verified;
    await listing.save();
    return listing;
  }

  /**
   * Bulk delete listings atomically (Admin) and clean up media files
   */
  async bulkDeleteListings(ids) {
    const listings = await Listing.find({ _id: { $in: ids } })
      .select('images videos propertyDocument')
      .lean();

    const result = await this.runTransaction(async (session) => {
      const sessionOpt = session ? { session } : {};
      await Listing.deleteMany({ _id: { $in: ids } }, sessionOpt);
      await SellerLead.deleteMany({ listingId: { $in: ids } }, sessionOpt);
      return true;
    });

    const uploadService = require('./upload.service');
    for (const listing of listings) {
      try {
        if (listing.images && listing.images.length > 0) {
          await uploadService.deleteFiles(listing.images);
        }
        if (listing.videos && listing.videos.length > 0) {
          await uploadService.deleteFiles(listing.videos);
        }
        if (listing.propertyDocument && listing.propertyDocument.url) {
          await uploadService.deleteFile(listing.propertyDocument.url);
        }
      } catch (cleanupErr) {
        console.warn(`Failed to cleanup files for listing ${listing._id}:`, cleanupErr.message);
      }
    }

    return result;
  }

  /**
   * Export listings matching criteria to CSV using streaming cursor
   */
  async exportListingsCsv(queryParams = {}, res) {
    const {
      district,
      subDistrict,
      taluka,
      village,
      type,
      minPrice,
      maxPrice,
      status,
      search,
      verified,
      featured,
    } = queryParams;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (district) filter.district = { $regex: escapeRegex(district.trim()), $options: 'i' };

    const targetSubDistrict = subDistrict || taluka;
    if (targetSubDistrict) filter.subDistrict = { $regex: escapeRegex(targetSubDistrict.trim()), $options: 'i' };
    if (village) filter.village = { $regex: escapeRegex(village.trim()), $options: 'i' };
    if (verified !== undefined) filter.verified = verified === 'true' || verified === true;
    if (featured !== undefined) filter.featured = featured === 'true' || featured === true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.priceAmount = {};
      if (minPrice !== undefined) filter.priceAmount.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.priceAmount.$lte = Number(maxPrice);
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { district: searchRegex },
        { subDistrict: searchRegex },
        { village: searchRegex },
        { additionalDetails: searchRegex },
      ];
    }

    const headers = [
      'ID',
      'Title',
      'Type',
      'District',
      'SubDistrict',
      'Village',
      'PriceAmount',
      'PriceUnit',
      'Status',
      'Verified',
      'Featured',
      'OwnerName',
      'OwnerMobile',
      'CreatedAt',
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=properties-export-${Date.now()}.csv`);

    res.write(headers.join(',') + '\n');

    const cursor = Listing.find(filter).sort({ createdAt: -1 }).cursor();

    for await (const item of cursor) {
      const row = [
        `"${item._id}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.type || '').replace(/"/g, '""')}"`,
        `"${(item.district || '').replace(/"/g, '""')}"`,
        `"${(item.subDistrict || '').replace(/"/g, '""')}"`,
        `"${(item.village || '').replace(/"/g, '""')}"`,
        item.priceAmount || 0,
        `"${(item.priceUnit || '').replace(/"/g, '""')}"`,
        `"${item.status || ''}"`,
        item.verified ? 'Yes' : 'No',
        item.featured ? 'Yes' : 'No',
        `"${(item.ownerName || '').replace(/"/g, '""')}"`,
        `"${(item.ownerMobile || '').replace(/"/g, '""')}"`,
        `"${new Date(item.createdAt).toISOString()}"`,
      ];
      res.write(row.join(',') + '\n');
    }

    res.end();
  }
}

module.exports = new ListingService();
