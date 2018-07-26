import React, { Component } from 'react';
import { Page, Icon, Toolbar, Select, Card, Button, ProgressCircular } from 'react-onsenui';
import RestAPI from '../../../rest.api';
import moment from 'moment';
import { RenderManyToOne } from '../../../components/RenderManyToOne';
import { CardTabs } from '../../../components/cardTabs';
import ProductDetailsPage from '../product/product-details';
import ProductsList from '../product/list-products';
import SwiperView from '../../../components/Swiper';
import { DateField } from '../../../components/Fields'
import ons from 'onsenui';

const getStatusSelect = () => ({
    data: [
        { id: 1, value: 'Draft' },
        { id: 2, value: 'Finalize' },
        { id: 3, value: 'orderConfirmed' },
        { id: 4, value: 'Finished' },
        { id: 5, value: 'Canceled' }
    ],
    total: 5
});

class viewQuotation extends Component {

    constructor(props) {
        super(props);
        this.state = {
            orderForm: {
                creationDate: moment().format('YYYY-MM-DD'),
                clientPartner: null,
                contactPartner: null,
                currency: null,
                company: null,
                duration: {
                    id: 4,
                    name: '15 days'
                },
                endOfValidityDate: moment().add(15, 'days').format('YYYY-MM-DD'),
                cancelReason: null,
                saleOrderLineList: [],
                saleOrderLineTaxList: [],
                statusSelect: 1,
                exTaxTotal: 0.00,
                inTaxTotal: 0.00,
                taxTotal: 0.00
            },
            recordList: [],
            isNew: false,
            edit: false,
            activeTab: 0,
            isLoading: false
        }
        this.restAPI = new RestAPI();
    }

    fetchNewData(data) {
        this.setState({ isLoading: true }, () => {
            this.restAPI.fetch('com.axelor.apps.sale.db.SaleOrder', data.id)
                .then((res) => res.json())
                .then((result) => {
                    const { data } = result;
                    if (data && data.length > 0) {
                        const orderForm = Object.assign({}, data[0]);
                        const { recordList } = this.state;
                        const targetIndex = recordList.findIndex(r => r.id === orderForm.id);
                        recordList[targetIndex] = Object.assign({}, orderForm);
                        this.setState({ orderForm, recordList, isLoading: false });
                    }
                });
        });
    }

    componentDidMount() {
        const { order, data } = this.props.route;
        if (order && order.id !== undefined) {
            // view
            const records = this.getRecordsByIndex(order, true)
            if (records) {
                const targetIndex = data.findIndex(r => r.id === order.id);
                this.swiper.slideTo(targetIndex, 0, true);
                this.setState({ recordList: [...data], activeIndex: targetIndex });
                this.fetchNewData(order);
            }
        }
        else {
            //add
            this.setState({
                isNew: true,
                edit: true,
                activeTab: 0,
            });
        }
    }

    onInputChange(e, name) {
        const { orderForm, recordList, isNew } = this.state;
        const { value } = e.target;
        if (isNew) {
            this.setState({
                orderForm: {
                    ...orderForm,
                    [name]: value
                }
            });
        } else {
            const targetIndex = recordList.findIndex(r => r.id === orderForm.id);
            const record = { ...recordList[targetIndex] };
            record[name] = value;
            recordList[targetIndex] = { ...record };
            this.setState({ recordList });
        }
    }

    onSave() {
        const { orderForm, recordList } = this.state;
        this.setState({ isLoading: true });

        const record = recordList.find(r => r.id === orderForm.id);
        if (record && record.id !== undefined) {
            //edit
            this.restAPI.update('com.axelor.apps.sale.db.SaleOrder', record, record.id)
                .then(res => res.json())
                .then(result => {
                    const newRecord = result.data[0];
                    if (this.props.route.updateQuotation) {
                        this.props.route.updateQuotation(newRecord);
                    }
                    this.fetchNewData(newRecord);
                    this.setState({ edit: false, isLoading: false });
                });
        }
        else {
            this.restAPI.add('com.axelor.apps.sale.db.SaleOrder', orderForm)
                .then(res => res.json())
                .then(result => {
                    this.setState({
                        recordList: [result.data[0], ...orderForm], isNew: false, edit: false, isLoading: false
                    }, () => {
                        this.onRecordSwipe(result.data[0]);
                    })
                });
        }
    }

    deleteQuotation(order) {
        this.restAPI.delete('com.axelor.apps.sale.db.SaleOrder', order.id).then(res => {
            if (this.props.route.removeQuotation) {
                this.props.route.removeQuotation(order);
            }
            this.props.navigator.popPage();
        });
    }

    closeEdit(close) {
        const { recordList } = this.state;
        const { order } = this.props.route;
        return new Promise((resolve, reject) => {
            const targetIndex = recordList.findIndex(record => record.id === order.id);
            this.isRecordChanged(close)
                .then(ok => {
                    if (ok) {
                        recordList[targetIndex] = order;
                        this.setState({ edit: false, order, recordList });
                        resolve(true);
                    }
                })
        })
    }

    onAddProduct(product, targetIndex = null) {
        const { recordList, isNew } = this.state;
        let { orderForm } = this.state;
        let { saleOrderLineList = [], saleOrderLineTaxList = [], exTaxTotal = 0.00, inTaxTotal = 0.00 } = orderForm;

        if (!isNew) {
            const target = recordList.findIndex(r => r.id === orderForm.id);
            orderForm = recordList[target];
        }
        if (targetIndex !== null) {
            saleOrderLineList[targetIndex] = product;
            saleOrderLineTaxList[targetIndex] = { exTaxBase: product.exTaxTotal, taxTotal: product.amount_tax, taxLine: product.tax };
        }
        else {
            saleOrderLineList.push(product);
            saleOrderLineTaxList.push({ exTaxBase: product.exTaxTotal, taxTotal: product.amount_tax, taxLine: product.tax });
        }
        exTaxTotal = Number(exTaxTotal) + Number(product.exTaxTotal - product.oldExtotal || 0);
        inTaxTotal = Number(inTaxTotal) + Number(product.inTaxTotal - product.oldIxtotal || 0);

        orderForm.saleOrderLineList = [...saleOrderLineList];
        orderForm.saleOrderLineTaxList = [...saleOrderLineTaxList];

        if (isNew) {
            this.setState({ orderForm: { ...orderForm, exTaxTotal, inTaxTotal, tax_total: inTaxTotal - exTaxTotal } });
        }
        else {
            const target = recordList.findIndex(r => r.id === orderForm.id);
            recordList[target] = { ...orderForm, exTaxTotal, inTaxTotal, tax_total: inTaxTotal - exTaxTotal }
            this.setState({ recordList });
        }
    }

    onDeleteProduct(selectOrder, index) {
        //deleteProductDetail
        const { isNew, orderForm, recordList } = this.state;
        let { saleOrderLineList = [], saleOrderLineTaxList = [], exTaxTotal = 0, inTaxTotal = 0 } = orderForm;

        if (isNew) {
            orderForm.saleOrderLineList.splice(index, 1);
            orderForm.saleOrderLineTaxList.splice(index, 1);

            orderForm.saleOrderLineList = [...saleOrderLineList];
            orderForm.saleOrderLineTaxList = [...saleOrderLineTaxList];

            exTaxTotal = orderForm.exTaxTotal - selectOrder.exTaxTotal;
            inTaxTotal = orderForm.inTaxTotal - selectOrder.inTaxTotal;

            this.setState({ orderForm: { ...orderForm, exTaxTotal, inTaxTotal, tax_total: inTaxTotal - exTaxTotal } });
        } else {
            const target = this.props.route && this.props.route.order && recordList.findIndex(r => r.id === this.props.route.order.id);
            const orderForm = recordList[target];

            orderForm.saleOrderLineList.splice(index, 1);
            orderForm.saleOrderLineTaxList.splice(index, 1);

            orderForm.saleOrderLineList = [...saleOrderLineList];
            orderForm.saleOrderLineTaxList = [...saleOrderLineTaxList];

            exTaxTotal = orderForm.exTaxTotal - selectOrder.exTaxTotal;
            inTaxTotal = orderForm.inTaxTotal - selectOrder.inTaxTotal;
            recordList[target] = {
                ...orderForm, exTaxTotal,
                inTaxTotal, tax_total: inTaxTotal - exTaxTotal
            }
            this.setState({ recordList });
        }
    }

    getStatus(value) {
        const { data } = getStatusSelect();
        return (data.find(item => item.id === Number(value)));
    }

    calculateEndOfValidaty() {
        const { orderForm, recordList, isNew } = this.state;
        const { order } = this.props.route;
        let calDate;
        if (isNew) {
            if (orderForm.duration.name === '15 days') {
                calDate = moment(orderForm.creationDate).add(15, 'days')
                orderForm['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            } else if (orderForm.duration.name === '1 month') {
                calDate = moment(orderForm.creationDate).add(1, 'month')
                orderForm['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            } else if (orderForm.duration.name === '2 month') {
                calDate = moment(orderForm.creationDate).add(2, 'month')
                orderForm['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            } else if (orderForm.duration.name === '6 month') {
                calDate = moment(orderForm.creationDate).add(6, 'month')
                orderForm['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            }
            console.log('calcDate', calDate)
            this.setState({ orderForm })
        } else {
            const targetIndex = recordList.findIndex(r => r.id === order.id);
            const record = { ...recordList[targetIndex] };
            if (record.duration.name === '15 days') {
                calDate = moment(record.creationDate).add(15, 'days')
                record['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            } else if (record.duration.name === '1 month') {
                calDate = moment(record.creationDate).add(1, 'month')
                record['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            } else if (record.duration.name === '2 month') {
                calDate = moment(record.creationDate).add(2, 'month')
                record['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            } else if (record.duration.name === '6 month') {
                calDate = moment(record.creationDate).add(6, 'month')
                record['endOfValidityDate'] = moment(calDate).format('YYYY-MM-DD')
            }
            recordList[targetIndex] = { ...record }
            this.setState({ recordList })
        }
    }

    renderItem(order) {
        console.log('order---=', order)
        const { orderForm, isNew, edit } = this.state;
        return (
            <div>
                <Card style={{ backgroundColor: '#F8F9F9' }}>
                    <div style={{ paddingLeft: '10px', paddingTop: '25px' }}>
                        {!edit &&
                            <Button style={{ backgroundColor: '#79BB45', borderRadius: '15px' }}>{order && order.statusSelect && `${this.getStatus(order.statusSelect).value}`}</Button>
                        }
                        {edit &&
                            <div>
                                <div style={{ color: 'gray' }}>Status</div>
                                {/* {order.statusSelect && (this.getStatus(order.statusSelect).value === 'Canceled' ? edit : !edit) ? */}
                                <Select
                                    style={{ width: '90%', paddingBottom: '10px' }}
                                    className="status-select-input"
                                    value={order && order.statusSelect && `${this.getStatus(order.statusSelect).id}`}
                                    onChange={(e) => this.onInputChange({ target: { value: e.target.value } }, 'statusSelect')} >
                                    <option disabled value></option>
                                    {
                                        getStatusSelect().data.map((s, i) => (
                                            (([null, undefined].includes(orderForm.statusSelect) || (edit || isNew ? true : false)) &&
                                                <option key={i} value={s.id}>{s.value}</option>
                                            )))
                                    }
                                </Select>
                                {/* : ''} */}
                            </div>
                        }
                        {order && order.statusSelect && this.getStatus(order.statusSelect).value === 'Canceled' ?
                            <RenderManyToOne
                                name="cancelReason"
                                fieldLabel='cancelReason'
                                placeholder='cancelReason'
                                targetName="name"
                                displayField="name"
                                value={order && (order.cancelReason)}
                                searchAPI={(e) => this.restAPI.search('com.axelor.apps.hr.db.LeaveLine')}
                                onChange={(e) => this.onInputChange(e, 'cancelReason')}
                                edit={order && order.statusSelect && this.getStatus(order.statusSelect).value === 'Canceled' ? true : edit}
                                navigator={this.props.navigator}
                            />
                            : ''
                        }
                        <RenderManyToOne
                            name="clientPartner"
                            fieldLabel='clientPartner'
                            placeholder='clientPartner'
                            targetName="fullName"
                            displayField="fullName"
                            value={(order && order.clientPartner) || null}
                            searchAPI={(e) => {
                                let options = {
                                    fields: ["fullName"],
                                    data: {
                                        criteria: [],
                                        operator: "and",
                                        _domain: "self.isCustomer = true AND self.isContact = false",
                                        _domainContext: {}
                                    }
                                };
                                return this.restAPI.search('com.axelor.apps.base.db.Partner', { ...options })
                            }}
                            onChange={(e) => this.onInputChange(e, 'clientPartner')}
                            // edit={order && order.statusSelect && this.getStatus(order.statusSelect).value === 'Draft' ? edit : isNew ? edit : false }
                            edit={edit || isNew ? true : false}
                            navigator={this.props.navigator}
                        />            
                        <RenderManyToOne
                            name="contactPartner"
                            fieldLabel='contactPartner'
                            placeholder='contactPartner'
                            targetName="fullName"
                            displayField="fullName"
                            value={order && (order.contactPartner || null)}
                            searchAPI={(e) => {
                                if (order.clientPartner && order.clientPartner.id) {
                                    let options = {
                                        fields: ["fullName"],
                                        data: {
                                            criteria: [],
                                            operator: "or",
                                            _domain: "self.isContact = true AND self.mainPartner.isCustomer = true",
                                            _domainContext: {}
                                        }
                                    };
                                    return this.restAPI.search('com.axelor.apps.base.db.Partner', { ...options });
                                }
                                else {
                                    let options = {
                                        fields: ["fullName"],
                                        data: {
                                            criteria: [],
                                            operator: "and",
                                            _domain: "self.isContact = true AND self.mainPartner.isCustomer = true",
                                            _domainContext: {}
                                        }
                                    };
                                    return this.restAPI.search('com.axelor.apps.base.db.Partner', { ...options });
                                }
                            }}
                            onChange={(e) => this.onInputChange(e, 'contactPartner')}
                            edit={edit || isNew ? true : false}
                            navigator={this.props.navigator}
                        />
                        <RenderManyToOne
                            name="company"
                            fieldLabel='company'
                            placeholder='company'
                            targetName="name"
                            displayField="name"
                            value={order && (order.company || null)}
                            searchAPI={(e) => this.restAPI.search('com.axelor.apps.base.db.Company')}
                            onChange={(e) => this.onInputChange(e, 'company')}
                            // edit={order && order.statusSelect && this.getStatus(order.statusSelect).value === 'Draft' ? edit : false}
                            edit={edit || isNew ? true : false}
                            navigator={this.props.navigator}
                        />
                        <RenderManyToOne
                            name="currency"
                            fieldLabel='currency'
                            placeholder='currency'
                            targetName="name"
                            displayField="name"
                            value={order && (order.currency || null)}
                            searchAPI={(e) => this.restAPI.search('com.axelor.apps.base.db.Currency')}
                            onChange={(e) => this.onInputChange(e, 'currency')}
                            edit={edit || isNew ? true : false}
                            navigator={this.props.navigator}
                        />
                    </div>
                </Card>

                <div style={{ display: 'flex', backgroundColor: 'rgb(49, 183, 172)', height: '40px', width: '90%', margin: 'auto', borderBottom: '5px' }}>
                    <Icon className='action-item-button' titleClassName="quotation-action-title" style={{ marginLeft: '40px', marginRight: '50px', paddingTop: '5px' }}
                        iconClassName="quotation-action-icon" icon="fa-eye" onClick={() => this.onViewPDF(orderForm)}> seeInPdf </Icon>
                    <Icon className='action-item-button' titleClassName="quotation-action-title" style={{ paddingTop: '5px' }}
                        iconClassName="quotation-action-icon" icon="fa-envelope" onClick={() => this.sendEmail(orderForm)}> sendByEmail </Icon>
                </div>

                <CardTabs
                    activeColor="#E2AA46"
                    titleClassName='sale-tabbar-title'
                    className="sale-item-tab"
                    active={this.state.activeTab}
                    onTabChange={(e) => this.setState({ activeTab: e })}
                    tabs={[
                        {
                            title: 'orderLine',
                            content:
                                <div>
                                    {
                                        order && order.saleOrderLineList && order.saleOrderLineList.length > 0 &&
                                        <div className="product-header">
                                            <div style={{ width: '40%' }}>{'Product'}</div>
                                            <div style={{ flex: 1 }}></div>
                                            <div style={{ flex: 1, textAlign: 'right' }}>{edit === true && !isNew ? 'Total' : ''}</div>
                                            <div style={{ flex: 1, textAlign: 'right' }}>{edit === false || isNew ? 'Total' : ''}</div>
                                        </div>
                                    }
                                    {edit === true ?
                                        <div>
                                            <div>
                                                {order && order.saleOrderLineList && order.saleOrderLineList.map((c, i) =>
                                                    // { return console.log('c-edit:::',c),//edit-true
                                                    <div key={i} className='sale-product-list' style={{ paddingLeft: 21, marginTop: 10 }}
                                                        onClick={() => this.props.navigator.pushPage({
                                                            key: Date.now(),
                                                            component: ProductDetailsPage,
                                                            addProduct: (product) => this.onAddProduct(product, i),
                                                            data: [c],
                                                            order: order
                                                        },
                                                            { animation: 'none' })}>
                                                        <div className="product-view common-font-size">
                                                            <div className='order-data1' style={{ marginTop: 15 }}>{c.fullName || c.productName}</div>
                                                            <div style={{ flex: 1 }}></div>
                                                            <div style={{ flex: 1, paddingLeft: 250 }}>{parseFloat(c.exTaxTotal || '0.00').toFixed(2)}</div>
                                                            {
                                                                order.statusSelect === 1 &&
                                                                <div style={{ flex: 1, textAlign: 'right' }} onClick={(e) => { e.stopPropagation(); this.onDeleteProduct(c, i) }}>
                                                                    <Icon style={{ color: "red", paddingRight: 15 }} icon='md-close' />
                                                                </div>
                                                            }
                                                        </div>
                                                        <div style={{ marginRight: 225, fontWeight: 100, fontSize: '9pt' }}>
                                                            <span style={{ marginRight: 5 }}>{parseInt(c.quantity, 10) || '0'}</span> X
                                          <span style={{ marginLeft: 5 }}>{parseFloat(c.price || c.rate || '0.00').toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    // }
                                                )
                                                }
                                            </div>
                                            {
                                                this.state.isNew ?
                                                    <div style={{ marginTop: 10 }} onClick={() => this.props.navigator.pushPage({
                                                        key: Date.now(),
                                                        component: ProductsList,
                                                        data: order,
                                                        order: this.props.order,
                                                        addProduct: (product) => this.onAddProduct(product)
                                                    }, { animation: 'none' })} className='add-new-product-title'>
                                                        <p>Add new product</p>
                                                        <Icon style={{ color: "rgb(0, 118, 255)" }} icon='md-plus' />
                                                    </div>
                                                    :
                                                    order.status_select === 1 &&
                                                    <div style={{ marginTop: 10 }} onClick={() => this.props.navigator.pushPage({
                                                        key: Date.now(),
                                                        component: ProductsList,
                                                        data: order,
                                                        order: this.props.order,
                                                        addProduct: (product) => this.onAddProduct(product)
                                                    }, { animation: 'none' })} className='add-new-product-title   '>
                                                        <p>Add new product</p>
                                                        <Icon style={{ color: "rgb(0, 118, 255)" }} icon='md-plus' />
                                                    </div>
                                            }
                                        </div>
                                        :
                                        <div>
                                            {
                                                order && order.saleOrderLineList && order.saleOrderLineList.length > 0 ?
                                                    order.saleOrderLineList.map((c, i) =>
                                                        // { return console.log('c:::',c),//editfalse, new
                                                        <div key={i} className='sale-product-list' style={{ paddingLeft: 21, marginTop: 10 }}
                                                            onClick={() => this.props.navigator.pushPage({
                                                                key: Date.now(),
                                                                component: ProductDetailsPage,
                                                                addProduct: (product) => this.onAddProduct(product, i),
                                                                data: [c],
                                                                order: order
                                                            },
                                                                { animation: 'none' })}
                                                        >
                                                            <div className="product-view common-font-size">
                                                                <div className='order-data1'>{c.fullName || ''}</div>
                                                                <div style={{ flex: 1 }}></div>
                                                                <div style={{ flex: 1 }}></div>
                                                                <div style={{ paddingLeft: 250 }}>{parseFloat(c.exTaxTotal).toFixed(2) + ' €'}</div>
                                                            </div>
                                                            <div style={{ marginRight: 225, fontWeight: 100, fontSize: '9pt' }}>
                                                                <span style={{ marginRight: 5 }}>{parseInt(c.quantity, 10) || '0'}</span> X
                                          <span style={{ marginLeft: 5 }}>{parseFloat(c.price || c.rate || '0.00').toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        // }
                                                    )
                                                    : <span>NoOrderLineFound</span>
                                            }
                                        </div>
                                    }
                                    <div className="product-total" style={{ textAlign: 'center', marginTop: 10 }}>
                                        <div className="product-total-title common-font-weight" style={{ paddinRight: 5, float: 'center' }}>totalWt
                                        <div className="product-total-text common-font-size" style={{ float: 'right' }}>{(parseFloat(orderForm.exTaxTotal || 0.00).toFixed(2)) + ' €' || ''}</div>
                                        </div>
                                    </div>
                                    <div className="product-total" style={{ textAlign: 'center', marginTop: 5 }}>
                                        <div className="product-total-title common-font-weight" style={{ paddinRight: 5, float: 'center' }}>tax
                                        <div className="product-total-text common-font-size" style={{ float: 'right' }}>{(parseFloat(orderForm.tax_total || 0.00).toFixed(2)) + ' €' || ''}</div>
                                        </div>
                                    </div>
                                    <div className="product-total" style={{ textAlign: 'center', marginTop: 5 }}>
                                        <div className="product-total-title common-font-weight" style={{ paddinRight: 5, float: 'center' }}>totalATI
                                        <div className="product-total-text common-font-size" style={{ float: 'right' }}>{(parseFloat(orderForm.inTaxTotal || 0.00).toFixed(2)) + ' €' || ''}</div>
                                        </div>
                                    </div>
                                </div>
                        },
                        {
                            title: 'taxLine',
                            content:
                                order && order.saleOrderLineList && order.saleOrderLineTaxList.length > 0 ?
                                    <div>
                                        <div style={{ display: 'flex', marginTop: 15, marginLeft: 15, color: 'gray' }}>
                                            <div style={{ width: '40%', marginLeft: 4, paddingRight: '100px' }}>Tax</div>
                                            <div style={{ flex: 1, marginLeft: 6, paddingRight: '50px' }}>baseWT</div>
                                            <div style={{ flex: '1 1 2%', marginLeft: '-3px' }}>amountTax</div>
                                        </div>
                                        <div>
                                            {
                                                order && order.saleOrderLineTaxList && order.saleOrderLineTaxList.map((c, i) => {
                                                    return console.log('c-2', c),
                                                        <div key={i} style={{ display: 'flex', marginTop: 10, paddingLeft: 10 }} className='sale-product-list'>
                                                            <div className="order-data1 common-font-size" style={{ marginRight: 11 }}>{c.taxLine ? c.taxLine.name : ''}</div>
                                                            <div style={{ flex: 1, fontSize: '9pt' }}>{(c.exTaxBase || c.baseWT || '0.00')} </div>
                                                            <div style={{ flex: 1, fontSize: '9pt' }}>{(c.taxTotal || '0.00')} </div>
                                                        </div>
                                                }
                                                )}
                                        </div>
                                    </div>
                                    : isNew ? "" : <span className='notFoundItem'>NoTaxLineFound</span>
                        },
                        {
                            title: 'Others',
                            content:
                                <Card style={{ width: '335px', height: 'auto' }}>
                                    <DateField
                                        // edit={this.getStatus(order.statusSelect).value === 'Draft' ? edit : false}
                                        // edit={edit || isNew ? true : false}
                                        edit={false}
                                        title='creationDate'
                                        name='creationDate'
                                        onChange={(e) => this.onInputChange(e, 'creationDate', () => this.calculateEndOfValidaty())}
                                        value={order.creationDate || moment(new Date()).format('YYYY-MM-DD')}
                                    />
                                    <DateField
                                        // edit={this.getStatus(order.statusSelect).value === 'Draft' ? edit : false}
                                        // edit={edit || isNew ? true : false}
                                        edit={false}
                                        title='deliveryDate'
                                        name='deliveryDate'
                                        onChange={(e) => this.onInputChange(e, 'deliveryDate')}
                                        value={order.deliveryDate || ''}
                                    />
                                    <DateField
                                        edit={false}
                                        title='endOfValidityDate'
                                        name='endOfValidityDate'
                                        onChange={(e) => this.onInputChange(e, 'endOfValidityDate')}
                                        value={order.endOfValidityDate || ''}
                                    />
                                    <RenderManyToOne
                                        name="duration"
                                        fieldLabel='duration'
                                        placeholder='duration'
                                        targetName="name"
                                        displayField="name"
                                        value={order && (order.duration || null)}
                                        searchAPI={(e) => this.restAPI.search('com.axelor.apps.base.db.Duration')}
                                        onChange={(e) => this.onInputChange(e, 'duration', () => this.calculateEndOfValidaty())}
                                        edit={this.getStatus(order.statusSelect).value === 'Draft' ? edit : false}
                                        navigator={this.props.navigator}
                                    />
                                    <RenderManyToOne
                                        name="salemanUser"
                                        fieldLabel='salemanUser'
                                        placeholder='salemanUser'
                                        targetName="fullName"
                                        displayField="fullName"
                                        value={order && (order.salemanUser || null)}
                                        searchAPI={(e) => this.restAPI.search('com.axelor.auth.db.User')}
                                        onChange={(e) => this.onInputChange(e, 'salemanUser')}
                                        edit={this.getStatus(order.statusSelect).value === 'Draft' ? edit : false}
                                        navigator={this.props.navigator}
                                    />
                                    <RenderManyToOne
                                        name="paymentCondition"
                                        fieldLabel='paymentCondition'
                                        placeholder='paymentCondition'
                                        targetName="name"
                                        displayField="name"
                                        value={order && (order.paymentCondition || null)}
                                        searchAPI={(e) => this.restAPI.search('com.axelor.apps.account.db.PaymentCondition')}
                                        onChange={(e) => this.onInputChange(e, 'paymentCondition')}
                                        edit={this.getStatus(order.statusSelect).value === 'Draft' ? edit : false}
                                        navigator={this.props.navigator}
                                    />
                                    <RenderManyToOne
                                        name="paymentMode"
                                        fieldLabel='paymentMode'
                                        placeholder='paymentMode'
                                        targetName="name"
                                        displayField="name"
                                        value={order && (order.paymentMode || null)}
                                        searchAPI={(e) => this.restAPI.search('com.axelor.apps.account.db.PaymentMode')}
                                        onChange={(e) => this.onInputChange(e, 'paymentMode')}
                                        edit={this.getStatus(order.statusSelect).value === 'Draft' ? edit : false}
                                        navigator={this.props.navigator}
                                    />
                                </Card>
                        }
                    ]}
                />
            </div>
        )
    }

    getRecordsByIndex(record) {
        const { recordList } = this.state;
        let newList = [];
        const index = recordList.findIndex(l => l.id === record.id);
        // if (index >= recordList.length - 3) {
        //     // this.onLoadMore(() => {});
        // }    
        if (index === 0) {
            newList = recordList.slice(index, index + 2);
        } else {
            newList = recordList.slice(index - 1, index + 2)
        }
        return newList;
    }

    onRecordSwipe(record) {
        console.log('isrcordswipe')
        const list = this.getRecordsByIndex(record)
        if (list) {
            this.setState({ recordList: list, offset: 0, total: 0 }, () => {
                const { recordList } = this.state;
                const targetIndex = recordList.findIndex(r => r.id === record.id);
                this.fetchNewData(record)
                this.swiper.slideTo(targetIndex, 0, true);
            });
        }
        this.closeEdit().then(res => {
            this.fetchNewData(record);
        });
    }

    goBack() {
        const { edit } = this.state;
        if (!edit) {
            this.props.navigator.popPage();
            return;
        }
        this.isRecordChanged(true)
            .then(ok => {
                if (ok) {
                    this.props.navigator.popPage();
                }
            });
    }

    isRecordChanged(close) {
        return new Promise((resolve, reject) => {
            const { recordList, orderForm } = this.state;
            const { order } = this.props.route;
            const targetIndex = recordList.findIndex(record => record.id === order.id);
            if (JSON.stringify(recordList[targetIndex]) !== JSON.stringify(orderForm) && close) {
                ons.notification.confirm('Do you want to Close?', { title: 'Confirm', button: ['cancelButton', 'yesButton'] }).then(res => {
                    if (res === 1) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })
            } else {
                resolve(true);
            }
        });
    }

    renderToolbar() {
        const { isNew, edit, recordList, orderForm } = this.state;
        const order = (recordList && this.props.route && this.props.route.order) ? recordList.find(r => r.id === this.props.route.order.id) : {};
        return (
            <Toolbar>
                <div className="left">
                    <Icon style={{ paddingLeft: '5px', paddingTop: '5px', color: '#0076ff' }} icon="chevron-left" onClick={() => this.goBack(true)} />
                </div >
                <div className="center" style={{ marginTop: '-20px', paddingLeft: '50px' }} >
                    <p>{orderForm && orderForm.clientPartner ? orderForm.clientPartner.fullName : 'Quotation'}</p>
                </div>
                {isNew ?
                    <div className="right" >
                        <Icon style={{ color: '#0076ff' }} icon="fa-save" onClick={() => this.onSave()} />
                    </div>
                    :
                    !edit ?
                        <div className="right" style={{ color: '#0076ff', paddingRight: '5px' }}>
                            <Icon icon="fa-pencil" style={{ paddingRight: '10px' }} onClick={() => this.setState({ edit: !edit, activeTab: 0 })} />
                            <Icon icon="fa-trash" onClick={() => this.deleteQuotation(order)} />
                        </div>
                        :
                        <div className="right" style={{ color: '#0076ff', paddingRight: '5px' }}>
                            <Icon icon='fa-close' style={{ paddingRight: '10px' }} onClick={() => this.closeEdit(true)} />
                            <Icon icon='fa-save' onClick={() => this.onSave(order)} />
                        </div>
                }
            </Toolbar>
        )
    }

    render() {
        const { isNew, orderForm, recordList, isLoading } = this.state;
        console.log('orderForm', orderForm);
        console.log('recordList', recordList);
        // const orderData = ( recordList && this.props.route && this.props.route.order) ? recordList.find(r=> r.id === this.props.route.order.id): {};
        return (
            <Page
                renderToolbar={() => this.renderToolbar()}
                isRecordChange={() => this.isRecordChange()}
            >
                {
                    isLoading &&
                    <div style={{ textAlign: 'center', padding: 5 }}>
                        <ProgressCircular indeterminate />
                    </div>
                }
                {isNew ?
                    this.renderItem(orderForm)
                    :
                    // this.renderItem(orderData)
                    <SwiperView
                        recordList={recordList}
                        renderItem={(record) => this.renderItem(record)}
                        onActive={(record) => this.onRecordSwipe(record)}
                        onInitSwiper={(swiper) => this.swiper = swiper}
                    />
                }
            </Page>
        )
    }
}

export default viewQuotation;
