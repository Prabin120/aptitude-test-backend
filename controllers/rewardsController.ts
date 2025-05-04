import { Request, Response } from 'express';
import User, { IUser } from '../models/user';
import CoinTransaction from '../models/coinTransaction';
import ICustomRequest from "../utils/customRequest";
import Coin from '../models/coin';
import { createOrder, verifyPayment } from './paymentController';
import Payment from '../models/payment';

export const getCoins = async (username: string) => {
    const coins = await Coin.findOne({username})
    return coins
}

const getHistory = async (username: string, page: number, type?: string) => {
    try {
        const limit = 5;
        const skip = (Number(page) - 1) * limit;
        const filter: any = { username: username };
        if (type && ['withdrawal', 'earning'].includes(type)) {
            filter.type = type;
        }
        const coins = await CoinTransaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await CoinTransaction.countDocuments(filter);
        return {
            transactions: coins,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
        }
    } catch (error) {
        return {
            transactions: 0,
            total: 0,
            page: 0,
            totalPages: 0,
        }
    }
};

export const addCoins = async(username: string, coins: number, description: string) => {
    try {
        const coin = await getCoins(username);
        if (coin && coins > 0) {
            coin.balance += coins;
            await coin.save();
        } else{
            await Coin.create({ username, balance: coins, lifetimeEarnings: coins, totalWithdraw: 0 });
        }
        const order = await CoinTransaction.create({ username, amount: coins, type: "earning", description });
        return order.id
    } catch (error) {
        console.log(error);
        return null
    }
}

export const removeCoins = async(username: string, coins: number, description: string) => {
    try {
        const coin = await getCoins(username);
        if (coin && coins > 0) {
            coin.balance -= coins;
            await coin.save();
            const order = await CoinTransaction.create({ username, amount: coins, type: "withdrawal", description: description });
            return order.id
        }
        return null
    } catch (error) {
        console.log(error);
        return null
    }
}

export const getDashboard = async(req: ICustomRequest, res: Response) => {
    try {
        const username = req.username;
        if(!username){
            return res.status(400).json({ message: "User not found" });
        }
        let {filter} = req.query;
        const coins = await getCoins(username);
        const history = await getHistory(username, 1, String(filter));
        return res.status(200).json({ coins, history });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

export const getCoinsData = async (req: ICustomRequest, res: Response) => {
    try {
        const username = req.username;
        if(!username){
            return res.status(400).json({ message: "User not found" });
        }
        const coins = await getCoins(username);
        return res.status(200).json({ coins });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

export const getHistoryData = async (req: ICustomRequest, res: Response) => {
    try {
        const username = req.username;
        const { page = 1, type } = req.query;
        if(!username){
            return res.status(400).json({ message: "User not found" });
        }
        const history = await getHistory(username, Number(page), (type as string));
        return res.status(200).json({ history });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

export const verifyDepositCoins = async (req: ICustomRequest, res: Response) => {
    try {
        const username = req.username;
        if(!username){
            return res.status(400).json({ message: "User not found" });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body
        const payment = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)
        if (payment === undefined){
            return res.status(400).json({status: "failed", error: "Payment verification failed"})
        }
        await Payment.create({ user: username, paymentId: razorpay_payment_id, paymentMethod: "razorpay", amount: payment.amount, 
            paymentObject: payment, description: payment.description })
        const coinTransaction = new CoinTransaction({
            _id: orderId,
            username: username,
            amount: Number(payment.amount)/100,
            type: 'deposit',
            description: 'Deposit'
        });
        await coinTransaction.save();
        const coins = await getCoins(username);
        if (coins) {
            coins.balance += Number(payment.amount)/100;
            await coins.save();
        } else{
            await Coin.create({ username, balance: payment.amount, lifetimeEarnings: payment.amount, totalWithdraw: 0 });
        }
        res.status(201).json(coinTransaction);
    } catch (error) {
        res.status(500).json({error: 'Error depositing coins'});
    }
}

export const createDepositeOrder = async (req: ICustomRequest, res: Response) => {
    try {
        const username = req.username;
        if(!username){
            return res.status(400).json({ message: "User not found" });
        }
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `order_${Date.now()}`,
        }
        const order = await createOrder(options);
        return res.status(200).json({
        order_id: order,
        amount
        });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}

// export const withdrawCoins = async (req: ICustomRequest, res: Response) => {
//     try {
//         const user = req.user as IUser;
//         const {amount} = req.body;
//         if (user.coins < amount) {
//             return res.status(400).json({error: 'Insufficient coins'});
//         }
//         const coinTransaction = new CoinTransaction({
//             user: user._id,
//             amount,
//             type: 'withdrawal',
//             description: 'Withdrawal'
//         });
//         await coinTransaction.save();
//         user.coins -= amount;
//         await user.save();
//         res.status(201).json(coinTransaction);
//     } catch (error) {
//         res.status(500).json({error: 'Error withdrawing coins'});
//     }
// }
