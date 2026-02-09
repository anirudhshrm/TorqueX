/**
 * Integration Tests for Vehicle API
 * 
 * Note: These tests currently skip view rendering to avoid EJS template issues.
 * For full E2E testing with views, use manual curl/browser testing.
 * TODO: Add proper view mocking or use a headless browser for full integration tests.
 */

const vehicleController = require('../../src/controllers/vehicleController');

// Mock data
const mockVehicles = [
  {
    id: '1',
    name: 'Tesla Model 3',
    type: 'Electric',
    pricePerDay: 100,
    images: ['image1.jpg'],
    availability: true,
    description: 'Electric sedan',
    features: ['GPS', 'Bluetooth']
  },
  {
    id: '2',
    name: 'BMW X5',
    type: 'SUV',
    pricePerDay: 150,
    images: ['image2.jpg'],
    availability: true,
    description: 'Luxury SUV',
    features: ['4WD', 'Leather']
  }
];

describe('Vehicle Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      prisma: {
        vehicle: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn()
        }
      },
      query: {},
      params: {},
      user: null,
      app: {
        get: jest.fn().mockReturnValue('test')
      }
    };

    mockRes = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getAllVehicles', () => {
    it('should fetch vehicles from database', async () => {
      mockReq.prisma.vehicle.findMany.mockResolvedValue(mockVehicles);

      await vehicleController.getAllVehicles(mockReq, mockRes);

      expect(mockReq.prisma.vehicle.findMany).toHaveBeenCalled();
      expect(mockRes.render).toHaveBeenCalledWith(
        'vehicles/index',
        expect.objectContaining({
          vehicles: mockVehicles
        })
      );
    });

    it('should filter vehicles by type', async () => {
      mockReq.query.type = 'SUV';
      const suvVehicles = mockVehicles.filter(v => v.type === 'SUV');
      mockReq.prisma.vehicle.findMany.mockResolvedValue(suvVehicles);

      await vehicleController.getAllVehicles(mockReq, mockRes);

      expect(mockReq.prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'SUV' })
        })
      );
    });
  });

  describe('getVehicleById', () => {
    it('should fetch vehicle by ID', async () => {
      mockReq.params.id = '1';
      mockReq.prisma.vehicle.findUnique.mockResolvedValue(mockVehicles[0]);

      await vehicleController.getVehicleById(mockReq, mockRes);

      expect(mockReq.prisma.vehicle.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: '1' } })
      );
    });

    it('should return 404 for non-existent vehicle', async () => {
      mockReq.params.id = '999';
      mockReq.prisma.vehicle.findUnique.mockResolvedValue(null);

      await vehicleController.getVehicleById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
