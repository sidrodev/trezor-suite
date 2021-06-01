import { useEffect, useState } from 'react';
import { BuyTradeStatus, ExchangeTradeStatus, SellTradeStatus } from 'invity-api';
import useUnmount from 'react-use/lib/useUnmount';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import { useSelector, useActions } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import { Account } from '@wallet-types';
import { TradeBuy, TradeSell, TradeExchange } from '@wallet-types/coinmarketCommonTypes';
import { useFormDraft } from '@wallet-hooks/useFormDraft';

export const useInvityAPI = () => {
    const {
        selectedAccount,
        buyInfo,
        exchangeInfo,
        sellInfo,
        invityAPIUrl,
        exchangeCoinInfo,
    } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        buyInfo: state.wallet.coinmarket.buy.buyInfo,
        exchangeInfo: state.wallet.coinmarket.exchange.exchangeInfo,
        sellInfo: state.wallet.coinmarket.sell.sellInfo,
        invityAPIUrl: state.suite.settings.debug.invityAPIUrl,
        exchangeCoinInfo: state.wallet.coinmarket.exchange.exchangeCoinInfo,
    }));

    const { saveBuyInfo, saveExchangeInfo, saveExchangeCoinInfo, saveSellInfo } = useActions({
        saveBuyInfo: coinmarketBuyActions.saveBuyInfo,
        saveExchangeInfo: coinmarketExchangeActions.saveExchangeInfo,
        saveExchangeCoinInfo: coinmarketExchangeActions.saveExchangeCoinInfo,
        saveSellInfo: coinmarketSellActions.saveSellInfo,
    });

    if (selectedAccount.status === 'loaded') {
        if (invityAPIUrl) {
            invityAPI.setInvityAPIServer(invityAPIUrl);
        }

        invityAPI.createInvityAPIKey(selectedAccount.account?.descriptor);

        if (!buyInfo?.buyInfo) {
            coinmarketBuyActions.loadBuyInfo().then(buyInfo => {
                saveBuyInfo(buyInfo);
            });
        }

        if (!exchangeInfo) {
            coinmarketExchangeActions
                .loadExchangeInfo()
                .then(([exchangeInfo, exchangeCoinInfo]) => {
                    saveExchangeInfo(exchangeInfo);
                    saveExchangeCoinInfo(exchangeCoinInfo);
                });
        }

        if (!sellInfo) {
            coinmarketSellActions.loadSellInfo().then(sellInfo => {
                saveSellInfo(sellInfo);
            });
        }
    }

    return {
        buyInfo,
        exchangeInfo,
        exchangeCoinInfo,
        sellInfo,
    };
};

const BuyTradeFinalStatuses: BuyTradeStatus[] = ['SUCCESS', 'ERROR', 'BLOCKED'];

const shouldRefreshBuyTrade = (trade?: TradeBuy) =>
    trade && trade.data.status && !BuyTradeFinalStatuses.includes(trade.data.status);

export const useWatchBuyTrade = (account: Account, trade: TradeBuy) => {
    const REFRESH_SECONDS = 30;
    const { saveTrade } = useActions({ saveTrade: coinmarketBuyActions.saveTrade });
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefreshBuyTrade(trade)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    const { removeDraft } = useFormDraft('coinmarket-buy');

    useEffect(() => {
        if (trade && shouldRefreshBuyTrade(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            invityAPI.watchBuyTrade(trade.data, refreshCount).then(response => {
                if (response.status && response.status !== trade.data.status) {
                    const newDate = new Date().toISOString();
                    const tradeData = {
                        ...trade.data,
                        status: response.status,
                        error: response.error,
                    };
                    saveTrade(tradeData, account, newDate);
                }
                if (response.status && BuyTradeFinalStatuses.includes(response.status)) {
                    removeDraft(account.key);
                }
            });
            resetRefresh();
        }
    }, [account, cancelRefresh, refreshCount, removeDraft, resetRefresh, saveTrade, trade]);
};

export const ExchangeTradeFinalStatuses: ExchangeTradeStatus[] = ['SUCCESS', 'ERROR', 'KYC'];

const shouldRefreshExchangeTrade = (trade?: TradeExchange) =>
    trade && trade.data.status && !ExchangeTradeFinalStatuses.includes(trade.data.status);

export const useWatchExchangeTrade = (account: Account, trade: TradeExchange) => {
    const REFRESH_SECONDS = 30;
    const { saveTrade } = useActions({ saveTrade: coinmarketExchangeActions.saveTrade });
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefreshExchangeTrade(trade)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    useEffect(() => {
        if (trade && shouldRefreshExchangeTrade(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            invityAPI.watchExchangeTrade(trade.data, refreshCount).then(response => {
                if (response.status && response.status !== trade.data.status) {
                    const newDate = new Date().toISOString();
                    const tradeData = {
                        ...trade.data,
                        status: response.status,
                        error: response.error,
                    };
                    saveTrade(tradeData, account, newDate);
                }
            });
            resetRefresh();
        }
    }, [account, cancelRefresh, refreshCount, resetRefresh, saveTrade, trade]);
};

export const SellFiatTradeFinalStatuses: SellTradeStatus[] = [
    'SUCCESS',
    'ERROR',
    'BLOCKED',
    'CANCELLED',
    'REFUNDED',
];

const shouldRefreshSellTrade = (trade?: TradeSell) =>
    trade && trade.data.status && !SellFiatTradeFinalStatuses.includes(trade.data.status);

export const useWatchSellTrade = (account: Account, trade: TradeSell) => {
    const REFRESH_SECONDS = 30;
    const { saveTrade } = useActions({ saveTrade: coinmarketSellActions.saveTrade });
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefreshSellTrade(trade)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    useEffect(() => {
        if (trade && shouldRefreshSellTrade(trade)) {
            cancelRefresh();
            invityAPI.createInvityAPIKey(account.descriptor);
            invityAPI.watchSellTrade(trade.data, refreshCount).then(response => {
                if (response.status && response.status !== trade.data.status) {
                    const newDate = new Date().toISOString();
                    const tradeData = {
                        ...trade.data,
                        status: response.status,
                        error: response.error,
                    };
                    saveTrade(tradeData, account, newDate);
                }
            });
            resetRefresh();
        }
    }, [account, cancelRefresh, refreshCount, resetRefresh, saveTrade, trade]);
};
