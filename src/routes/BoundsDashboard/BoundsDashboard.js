import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Nav from 'yii-steroids/ui/nav/Nav';
import { getUser } from 'yii-steroids/reducers/auth';
import { getBaseCurrency, getPairName, getQuoteCurrency } from 'reducers/currency';
import { Translation } from 'react-i18next';

import { html, dal } from 'components';
import OrdersTable from './views/OrdersTable';
import BuyBoundsForm from './views/BuyBoundsForm';
import LiquidateBoundsForm from './views/LiquidateBoundsForm';
import OrderBook from './views/OrderBook';
import MainChart from './views/MainChart';
// import CurrencyEnum from 'enums/CurrencyEnum';
import CollectionEnum from 'enums/CollectionEnum';
import OrderSchema from 'types/OrderSchema';
import UserSchema from 'types/UserSchema';

import './BoundsDashboard.scss';

const bem = html.bem('BoundsDashboard');

@connect(state => ({
    pairName: getPairName(state),
    baseCurrency: getBaseCurrency(state),
    quoteCurrency: getQuoteCurrency(state),
    user: getUser(state),
}))
@dal.hoc(props =>
    [
        {
            url: `/api/v1/bonds/${props.pairName}/orders`,
            key: 'bondOrders',
            collection: CollectionEnum.BONDS_ORDERS,
        },
        {
            url: `/api/v1/liquidate/${props.pairName}/orders`,
            key: 'liquidateOrders',
            collection: CollectionEnum.NEUTRINO_ORDERS,
        },
        props.user && {
            url: `/api/v1/bonds/user/${props.user.address}`,
            key: 'userOrders',
            collection: [CollectionEnum.BONDS_ORDERS, CollectionEnum.NEUTRINO_ORDERS],
        },
    ].filter(Boolean)
)
export default class BoundsDashboard extends React.PureComponent {
    static propTypes = {
        bondOrders: PropTypes.arrayOf(OrderSchema),
        liquidateOrders: PropTypes.arrayOf(OrderSchema),
        user: UserSchema,
        userOrders: PropTypes.shape({
            opened: PropTypes.arrayOf(OrderSchema),
            history: PropTypes.arrayOf(OrderSchema),
        }),
    };

    constructor() {
        super(...arguments);

        this.state = {
            formTab: 'buy',
        };
    }

    render() {
        if (!this.props.bondOrders || !this.props.liquidateOrders) {
            return null;
        }

        return (
            <Translation>
                {t => (
                    <div className={bem.block()}>
                        <div className={bem.element('column', 'left')}>
                            <div className={bem.element('order-book')}>
                                <OrderBook
                                    orders={
                                        this.state.formTab === 'buy'
                                            ? this.props.bondOrders
                                            : this.props.liquidateOrders
                                    }
                                    user={this.props.user}
                                    baseCurrency={this.props.baseCurrency}
                                    quoteCurrency={this.props.quoteCurrency}
                                    formTab={this.state.formTab}
                                />
                            </div>
                            <div className={bem.element('forms')}>
                                <Nav
                                    isFullWidthTabs
                                    layout={'tabs'}
                                    onChange={formTab => this.setState({ formTab })}
                                    items={[
                                        {
                                            id: 'buy',
                                            label: t('enums.buy.label'),
                                            content: BuyBoundsForm,
                                        },
                                        {
                                            id: 'liquidate',
                                            label: t('enums.liquidate.label'),
                                            className: bem.element('danger-tab'),
                                            content: LiquidateBoundsForm,
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className={bem.element('column', 'right')}>
                            <div className={bem.element('graph')}>
                                <span className={bem.element('graph-title')}>
                                    {t('common.discount_with_percent.label')}
                                </span>
                                <MainChart pairName={this.props.pairName} />
                            </div>
                            <div className={bem.element('orders')}>
                                {this.props.userOrders && (
                                    <Nav
                                        className={bem.element('orders-nav')}
                                        layout={'tabs'}
                                        items={[
                                            {
                                                id: 'my-open-orders',
                                                label: t('common.my_open_orders.label'),
                                                content: OrdersTable,
                                                contentProps: {
                                                    items: this.props.userOrders.opened,
                                                    pairName: this.props.pairName,
                                                },
                                            },
                                            {
                                                id: 'my-orders-history',
                                                label: t('common.my_orders_history.label'),
                                                content: OrdersTable,
                                                contentProps: {
                                                    items: this.props.userOrders.history,
                                                    pairName: this.props.pairName,
                                                    isHistory: true,
                                                },
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Translation>
        );
    }
}
