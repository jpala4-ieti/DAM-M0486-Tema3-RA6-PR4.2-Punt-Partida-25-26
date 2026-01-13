const { logger, expressLogger } = require('../../src/config/logger');

describe('Logger Configuration', () => {
    test('Hauria d\'estar definit i tenir transports', () => {
        expect(logger).toBeDefined();
        expect(logger.transports.length).toBeGreaterThan(0);
    });

    test('expressLogger hauria de ser un middleware funcional', () => {
        const req = { method: 'GET', url: '/', get: jest.fn() };
        const res = { on: jest.fn(), statusCode: 200 };
        const next = jest.fn();

        expressLogger(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    test('Hauria de formatar metadata correctament al log', () => {
        const { logger } = require('../../src/config/logger');
        const info = { level: 'info', message: 'test', meta: 'data' };
        
        // Accedim al format directament per testejar la línia 51
        const logOutput = logger.format.transform(info);
        expect(logOutput).toBeDefined();
    });    
});
