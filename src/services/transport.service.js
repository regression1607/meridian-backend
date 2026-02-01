const { Vehicle, Route, TransportAllocation } = require('../models/Transport');
const ApiError = require('../utils/apiError');

class TransportService {
  // ============ VEHICLE METHODS ============
  async createVehicle(institutionId, vehicleData) {
    const existing = await Vehicle.findOne({
      institution: institutionId,
      vehicleNumber: vehicleData.vehicleNumber,
      isDeleted: false
    });

    if (existing) {
      throw new ApiError(400, 'Vehicle with this number already exists');
    }

    const vehicle = new Vehicle({
      ...vehicleData,
      institution: institutionId
    });

    await vehicle.save();
    return vehicle;
  }

  async getVehicles(institutionId, filters = {}) {
    const { status, vehicleType, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (status) query.status = status;
    if (vehicleType) query.vehicleType = vehicleType;

    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Vehicle.countDocuments(query)
    ]);

    return {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getVehicleById(vehicleId, institutionId) {
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      institution: institutionId,
      isDeleted: false
    });

    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    return vehicle;
  }

  async updateVehicle(vehicleId, institutionId, updateData) {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicleId, institution: institutionId, isDeleted: false },
      updateData,
      { new: true }
    );

    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    return vehicle;
  }

  async deleteVehicle(vehicleId, institutionId) {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicleId, institution: institutionId },
      { isDeleted: true },
      { new: true }
    );

    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    return vehicle;
  }

  // ============ ROUTE METHODS ============
  async createRoute(institutionId, routeData) {
    const existing = await Route.findOne({
      institution: institutionId,
      routeCode: routeData.routeCode,
      isDeleted: false
    });

    if (existing) {
      throw new ApiError(400, 'Route with this code already exists');
    }

    const route = new Route({
      ...routeData,
      institution: institutionId
    });

    await route.save();
    return route.populate('vehicle');
  }

  async getRoutes(institutionId, filters = {}) {
    const { status, vehicleId, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (status) query.status = status;
    if (vehicleId) query.vehicle = vehicleId;

    const skip = (page - 1) * limit;

    const [routes, total] = await Promise.all([
      Route.find(query)
        .populate('vehicle', 'vehicleNumber vehicleType driverName driverPhone')
        .sort({ routeName: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Route.countDocuments(query)
    ]);

    return {
      routes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getRouteById(routeId, institutionId) {
    const route = await Route.findOne({
      _id: routeId,
      institution: institutionId,
      isDeleted: false
    }).populate('vehicle');

    if (!route) {
      throw new ApiError(404, 'Route not found');
    }

    return route;
  }

  async updateRoute(routeId, institutionId, updateData) {
    const route = await Route.findOneAndUpdate(
      { _id: routeId, institution: institutionId, isDeleted: false },
      updateData,
      { new: true }
    ).populate('vehicle');

    if (!route) {
      throw new ApiError(404, 'Route not found');
    }

    return route;
  }

  async deleteRoute(routeId, institutionId) {
    const route = await Route.findOneAndUpdate(
      { _id: routeId, institution: institutionId },
      { isDeleted: true },
      { new: true }
    );

    if (!route) {
      throw new ApiError(404, 'Route not found');
    }

    return route;
  }

  // ============ ALLOCATION METHODS ============
  async allocateTransport(institutionId, allocationData) {
    const { student, route, stop, academicYear } = allocationData;

    // Check if student already has active allocation
    const existing = await TransportAllocation.findOne({
      institution: institutionId,
      student,
      academicYear,
      status: 'active',
      isDeleted: false
    });

    if (existing) {
      throw new ApiError(400, 'Student already has an active transport allocation');
    }

    // Get route to find stop fee
    const routeDoc = await Route.findById(route);
    if (!routeDoc) {
      throw new ApiError(404, 'Route not found');
    }

    const stopInfo = routeDoc.stops.find(s => s.stopName === stop);
    const monthlyFee = stopInfo?.monthlyFee || allocationData.monthlyFee || 0;

    const allocation = new TransportAllocation({
      ...allocationData,
      institution: institutionId,
      monthlyFee
    });

    await allocation.save();
    return allocation.populate(['student', 'route']);
  }

  async getAllocations(institutionId, filters = {}) {
    const { routeId, status, academicYear, page = 1, limit = 20 } = filters;
    
    const query = { institution: institutionId, isDeleted: false };
    if (routeId) query.route = routeId;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const skip = (page - 1) * limit;

    const [allocations, total] = await Promise.all([
      TransportAllocation.find(query)
        .populate('student', 'email profile studentData')
        .populate({
          path: 'route',
          select: 'routeName routeCode vehicle stops',
          populate: { path: 'vehicle', select: 'vehicleNumber driverName driverPhone' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TransportAllocation.countDocuments(query)
    ]);

    return {
      allocations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateAllocation(allocationId, institutionId, updateData) {
    const allocation = await TransportAllocation.findOneAndUpdate(
      { _id: allocationId, institution: institutionId, isDeleted: false },
      updateData,
      { new: true }
    ).populate(['student', 'route']);

    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    return allocation;
  }

  async deleteAllocation(allocationId, institutionId) {
    const allocation = await TransportAllocation.findOneAndUpdate(
      { _id: allocationId, institution: institutionId },
      { isDeleted: true },
      { new: true }
    );

    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    return allocation;
  }

  // ============ STATS ============
  async getTransportStats(institutionId) {
    const [
      totalVehicles,
      activeVehicles,
      totalRoutes,
      activeAllocations
    ] = await Promise.all([
      Vehicle.countDocuments({ institution: institutionId, isDeleted: false }),
      Vehicle.countDocuments({ institution: institutionId, status: 'active', isDeleted: false }),
      Route.countDocuments({ institution: institutionId, isDeleted: false }),
      TransportAllocation.countDocuments({ institution: institutionId, status: 'active', isDeleted: false })
    ]);

    return {
      totalVehicles,
      activeVehicles,
      totalRoutes,
      activeAllocations
    };
  }
}

module.exports = new TransportService();
