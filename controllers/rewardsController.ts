import { Request, Response } from 'express';
import User, { IUser } from '../models/user';
import CoinTransaction from '../models/coinTransaction';
import ICustomRequest from "../utils/customRequest";
import Coin from '../models/coin';

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

// export const depositCoins = async (req: ICustomRequest, res: Response) => {
//     try {
//         const user = req.user as IUser;
//         const {amount} = req.body;
//         const coinTransaction = new CoinTransaction({
//             user: user._id,
//             amount,
//             type: 'deposit',
//             description: 'Deposit'
//         });
//         await coinTransaction.save();
//         res.status(201).json(coinTransaction);
//     } catch (error) {
//         res.status(500).json({error: 'Error depositing coins'});
//     }
// }

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
