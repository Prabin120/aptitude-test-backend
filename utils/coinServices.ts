import dotenv from "dotenv";
import CoinTransaction from "../models/coinTransaction";
import Coin from "../models/coin";

dotenv.config();

export const coinNosForCode = new Map<string, number>([
    ["easy", parseInt(process.env.COIN_FOR_EASY_CODE ?? "10")],
    ["medium", parseInt(process.env.COIN_FOR_MEDIUM_CODE ?? "20")],
    ["hard", parseInt(process.env.COIN_FOR_HARD_CODE ?? "30")]
]);

export const updateCoinTransaction = async (coins: number, username: string, status: string, desc: string, type: string) => {
    const usersCoin = await Coin.findOne({ username });
    if (!usersCoin) {
        const newCoin = new Coin({
            username,
            balance: coins,
            lifetimeEarnings: coins,
            totalWithdraw: 0
        });
        await newCoin.save();
    } else{
        usersCoin.balance += coins;
        usersCoin.lifetimeEarnings += coins;
        await usersCoin.save();
    }
    const transaction = new CoinTransaction({
        username,
        amount: coins,
        status,
        type,
        description: desc
    });
    await transaction.save();
}