// import request from 'supertest';
// import app from '../..';
// import jwt from 'jsonwebtoken';

// // Mock User model
// jest.mock('../../models/user', () => {
//     interface IMockUser {
//         email: string;
//         password: string;
//         name: string;
//         username: string;
//         role: string;
//         save: jest.Mock;
//         toJSON: jest.Mock;
//     }

//     const mockUser: IMockUser = {
//         email: 'test@example.com',
//         password: 'hashedpassword',
//         name: 'Test User',
//         username: 'testuser',
//         role: 'user',
//         save: jest.fn().mockResolvedValue({}),
//         toJSON: jest.fn().mockReturnValue({})
//     };

//     const MockUser = function(this: IMockUser, data: Partial<IMockUser>) {
//         Object.assign(this, mockUser, data);
//         this.save = jest.fn().mockResolvedValue(this);
//         this.toJSON = jest.fn().mockReturnValue(this);
//         return this;
//     } as unknown as (new (data: Partial<IMockUser>) => IMockUser) & {
//         findOne: jest.Mock;
//     };

//     MockUser.findOne = jest.fn();
//     MockUser.prototype = Object.create({});
//     MockUser.prototype.constructor = MockUser;

//     return {
//         __esModule: true,
//         default: MockUser
//     };
// });

// describe('Payment Controller', () => {
//     let userAuthToken: string;

//     beforeAll(async () => {
//         // Create a mock JWT token
//         const token = jwt.sign(
//             { username: 'testuser', name: 'Test User', role: 'user' },
//             process.env.JWT_ACCESS_SECRET_KEY as string,
//             { expiresIn: '1h' }
//         );
//         userAuthToken = `access_token=${token}`;
//     });

//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('POST /p/api/v1/payment/create-session', () => {
//         it('should create a payment session', async () => {
//             const response = await request(app)
//                 .post('/p/api/v1/payment/create-session')
//                 .set('Cookie', userAuthToken)
//                 .send({
//                     amount: 1000,
//                     currency: 'INR'
//                 })
//                 .expect(200);

//             expect(response.body).toHaveProperty('order_id');
//             expect(response.body).toHaveProperty('amount');
//         });
//     });

//     describe('POST /p/api/v1/payment/webhook', () => {
//         it('should handle successful payment webhook', async () => {
//             const response = await request(app)
//                 .post('/p/api/v1/payment/webhook')
//                 .set('Cookie', userAuthToken)
//                 .send({
//                     razorpay_payment_id: 'test_payment_id',
//                     razorpay_order_id: 'test_order_id',
//                     razorpay_signature: 'test_signature'
//                 })
//                 .expect(200);

//             expect(response.body).toHaveProperty('success', true);
//         });
//     });
// }); 