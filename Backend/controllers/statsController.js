const Url = require('../models/Url');

// @desc    Get public stats for landing page
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        const totalUrls = await Url.countDocuments();
        const totalClicks = await Url.aggregate([
            { $group: { _id: null, totalClicks: { $sum: '$visitCount' } } }
        ]);
        const clicks = totalClicks.length > 0 ? totalClicks[0].totalClicks : 0;

        // For uptime, you can calculate from logs or use a placeholder
        // Here we use a placeholder value
        const uptime = '99.9%';

        res.status(200).json({
            urlsCreated: totalUrls,
            clicksTracked: clicks,
            uptime
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
