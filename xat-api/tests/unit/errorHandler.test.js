const errorHandler = require('../../src/middleware/errorHandler');

describe('ErrorHandler Middleware', () => {
    let mockReq, mockRes, next;

    beforeEach(() => {
        mockReq = { path: '/test', method: 'GET' };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
    });

    test('Hauria de gestionar SequelizeValidationError amb status 400', () => {
        const error = { name: 'SequelizeValidationError', errors: [{ message: 'camp obligatori' }] };
        errorHandler(error, mockReq, mockRes, next);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error de validació' }));
    });

    test('Hauria de retornar 500 per a errors genèrics', () => {
        const error = new Error('Error fatal');
        errorHandler(error, mockReq, mockRes, next);
        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('Hauria de gestionar SequelizeValidationError correctament', () => {
        const errorHandler = require('../../src/middleware/errorHandler');
        const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const err = { 
            name: 'SequelizeValidationError', 
            errors: [{ message: 'El prompt és obligatori' }] 
        };
        
        errorHandler(err, {}, mockRes, () => {});
        
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Error de validació'
        }));
    });    
});
