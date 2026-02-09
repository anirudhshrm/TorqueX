/**
 * Deal Controller
 * Handles creating and managing special deals
 */

const crypto = require('../utils/crypto');
const logger = require('../utils/logger');
const { getCache, setCache, deleteCachePattern } = require('../utils/redis');

// Get deals admin page
exports.getDealsAdmin = async (req, res) => {
  try {
    // Try to get from cache
    const cacheKey = 'deals:admin:list';
    const cached = await getCache(cacheKey);
    
    let deals;
    if (cached) {
      deals = cached;
    } else {
      deals = await req.prisma.deal.findMany({
        orderBy: {
          validUntil: 'desc'
        }
      });
      
      // Cache for 5 minutes
      await setCache(cacheKey, deals, 300);
    }
    
    res.render('admin/deals', {
      title: 'Manage Deals',
      deals,
      user: req.user,
      successMessage: req.flash('success'),
      errorMessage: req.flash('error')
    });
  } catch (error) {
    console.error('Admin deals error:', error);
    res.status(500).render('error', { 
      message: 'Error loading deals',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Create a new deal
exports.createDeal = async (req, res) => {
  try {
    const {
      code,
      discount,
      description,
      validFrom,
      validUntil,
      isActive
    } = req.body;

    // Validate required fields
    if (!code || !discount || !validFrom || !validUntil) {
      const errorMsg = 'Missing required fields';
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ success: false, message: errorMsg });
      }
      req.flash('error', errorMsg);
      return res.redirect('/admin/deals');
    }

    // Hash the promo code for security
    const codeHash = crypto.hashPromoCode(code);
    
    logger.info('Creating new deal', { code: code.toUpperCase(), discount });

    const deal = await req.prisma.deal.create({
      data: {
        code: code.toUpperCase(),
        codeHash,
        discount: Number(discount),
        description,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: isActive === 'on' || isActive === true || isActive === 'true'
      }
    });

    logger.info('Deal created successfully', { dealId: deal.id, code: deal.code });
    
    // Invalidate deal caches
    await deleteCachePattern('deals:*');
    await deleteCachePattern('admin:dashboard:*');
    
    if (req.headers['content-type'] === 'application/json') {
      return res.json({ success: true, message: 'Deal created successfully!', deal });
    }
    req.flash('success', 'Deal created successfully!');
    res.redirect('/admin/deals');
  } catch (error) {
    logger.error('Deal creation failed', { error: error.message });
    if (req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ success: false, message: `Failed to create deal: ${error.message}` });
    }
    req.flash('error', `Failed to create deal: ${error.message}`);
    res.redirect('/admin/deals');
  }
};

// Update a deal
exports.updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount,
      description,
      validFrom,
      validUntil,
      isActive
    } = req.body;

    // Validate required fields
    if (!code || !discount || !validFrom || !validUntil) {
      const errorMsg = 'Missing required fields';
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ success: false, message: errorMsg });
      }
      req.flash('error', errorMsg);
      return res.redirect('/admin/deals');
    }

    // Hash the promo code for security
    const codeHash = crypto.hashPromoCode(code);
    
    logger.info('Updating deal', { dealId: id, code: code.toUpperCase() });

    const deal = await req.prisma.deal.update({
      where: { id: Number(id) },
      data: {
        code: code.toUpperCase(),
        codeHash,
        discount: Number(discount),
        description,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: isActive === 'on' || isActive === true || isActive === 'true'
      }
    });

    logger.info('Deal updated successfully', { dealId: deal.id, code: deal.code });
    
    // Invalidate deal caches
    await deleteCachePattern('deals:*');
    await deleteCachePattern('admin:dashboard:*');
    
    if (req.headers['content-type'] === 'application/json') {
      return res.json({ success: true, message: 'Deal updated successfully!', deal });
    }
    req.flash('success', 'Deal updated successfully!');
    res.redirect('/admin/deals');
  } catch (error) {
    logger.error('Deal update failed', { error: error.message });
    if (req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ success: false, message: `Failed to update deal: ${error.message}` });
    }
    req.flash('error', `Failed to update deal: ${error.message}`);
    res.redirect('/admin/deals');
  }
};

// Delete a deal
exports.deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.deal.delete({
      where: { id: Number(id) }
    });

    logger.info('Deal deleted successfully', { dealId: id });
    
    // Invalidate deal caches
    await deleteCachePattern('deals:*');
    await deleteCachePattern('admin:dashboard:*');
    
    req.flash('success', 'Deal deleted successfully!');
    res.redirect('/admin/deals');
  } catch (error) {
    console.error('Error deleting deal:', error);
    req.flash('error', `Failed to delete deal: ${error.message}`);
    res.redirect('/admin/deals');
  }
};

// Get active deals
exports.getActiveDeals = async (req, res) => {
  try {
    // Try to get from cache
    const cacheKey = 'deals:active:list';
    let activeDeals = await getCache(cacheKey);
    
    if (!activeDeals) {
      activeDeals = await req.prisma.deal.findMany({
        where: {
          isActive: true,
          validUntil: {
            gte: new Date()
          }
        },
        orderBy: {
          validUntil: 'asc'
        }
      });
      
      // Cache for 10 minutes
      await setCache(cacheKey, activeDeals, 600);
    }
    
    // Remove codeHash from response (for security)
    const safeDeals = activeDeals.map(deal => ({
      ...deal,
      codeHash: undefined
    }));
    
    logger.info('Active deals retrieved', { count: safeDeals.length });
    
    res.status(200).json({ 
      success: true, 
      deals: safeDeals 
    });
  } catch (error) {
    logger.error('Get active deals failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: 'Error getting active deals' 
    });
  }
};

// Validate and apply promo code
exports.validatePromoCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required'
      });
    }
    
    // Hash the provided code and find matching deal
    const codeHash = crypto.hashPromoCode(code);
    
    const deal = await req.prisma.deal.findUnique({
      where: { codeHash }
    });
    
    if (!deal) {
      logger.warn('Invalid promo code attempted', { 
        code: code.toUpperCase() 
      });
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }
    
    // Check if deal is active
    if (!deal.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This promo code is no longer valid'
      });
    }
    
    // Check if deal is within valid date range
    const now = new Date();
    if (now < deal.validFrom || now > deal.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'This promo code is not currently valid'
      });
    }
    
    // Check usage limit if specified
    if (deal.usageLimit && deal.currentUsage >= deal.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'This promo code has reached its usage limit'
      });
    }
    
    logger.info('Promo code validated successfully', { 
      code: code.toUpperCase(),
      discount: deal.discountValue
    });
    
    // Return deal details (without hash)
    res.status(200).json({
      success: true,
      deal: {
        id: deal.id,
        discountType: deal.discountType,
        discountValue: deal.discountValue,
        minPurchase: deal.minPurchase
      }
    });
  } catch (error) {
    logger.error('Promo code validation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error validating promo code'
    });
  }
};