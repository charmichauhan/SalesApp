import React, { Component } from 'react';
import { Page, Toolbar, Icon, ProgressCircular, Card, Select } from 'react-onsenui';
import RestAPI from '../../../rest.api';
import { CardField } from '../../../components/Fields';
import SwiperView from '../../../components/Swiper';
import CardTabs from '../../../components/cardTabs';
import { RenderManyToOne } from '../../../components/RenderManyToOne';
import ons from 'onsenui';

const getProductType = () => ({
    data: [
        { id: 'service', value: 'Service' },
        { id: 'storable', value: 'Product' },
    ],
    total: 2
});

class viewProduct extends Component {

    constructor(props) {
        super(props)
        this.state = {
            productForm: {
                name: '',
                code: '',
                salePrice: 0.00,
                unit: '',
                productFamily: null,
                productCategory: null,
                productTypeSelect: 'service',
                sellable: true
            },
            recordList: [],
            edit: false,
            isNew: false,
            activeTab: 0,
            isLoading: false
        }
        this.restAPI = new RestAPI();
    }

    fetchNewData(data) {
        this.setState({ isLoading: true }, () => {
            this.restAPI.fetch('com.axelor.apps.base.db.Product', data.id)
                .then((res) => res.json())
                .then((result) => {
                    const { data } = result;
                    if (data && data.length > 0) {
                        const productForm = Object.assign({}, data[0]);
                        const { recordList } = this.state;
                        const targetIndex = recordList.findIndex(r => r.id === productForm.id);
                        recordList[targetIndex] = Object.assign({}, productForm);
                        this.setState({ productForm, recordList, isLoading: false });
                    }
                });
        });
    }

    componentDidMount() {
        const { product, data } = this.props.route;
        if (product && product.id !== undefined) {
            // view
            const targetIndex = data.findIndex(r => r.id === product.id);
            this.swiper.slideTo(targetIndex, 0, true);
            this.setState({ recordList: [...data], activeIndex: targetIndex });
            this.fetchNewData(product);
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

    changeField(name, value) {
        const { productForm, recordList, isNew } = this.state;
        if (isNew) {
            this.setState({
                productForm: {
                    ...productForm,
                    [name]: value,
                }
            })
        } else {
            const targetIndex = recordList.findIndex(r => r.id === productForm.id);
            const record = { ...recordList[targetIndex] };
            record[name] = value;
            recordList[targetIndex] = { ...record };
            this.setState({ recordList });
        }
    }

    onSave() {
        const { productForm, recordList } = this.state;
        const record = recordList.find(r => r.id === productForm.id);
        this.setState({ isLoading: true })
        if (record && record.id !== undefined) {
            //edit
            this.restAPI.update('com.axelor.apps.base.db.Product', record, record.id)
                .then(res => res.json())
                .then(result => {
                    const newRecord = result.data[0];
                    if (this.props.route.updateProduct) {
                        this.props.route.updateProduct(newRecord);
                    }
                    this.fetchNewData(newRecord);
                    this.setState({ edit: false, isLoading: false },
                        () => {
                            this.onRecordSwipe(result.data[0]);
                        });
                });
        }
        else {
            this.restAPI.add('com.axelor.apps.base.db.Product', productForm)
                .then(res => res.json())
                .then(result => {
                    this.setState({
                        recordList: [result.data[0], ...productForm], isNew: false, edit: false, isLoading: false
                    },
                        () => {
                            this.onRecordSwipe(result.data[0]);
                        })
                })
        }
    }

    closeEdit(close) {
        const { recordList, productForm } = this.state;
        return new Promise((resolve, reject) => {
            const targetIndex = recordList.findIndex(record => record.id === productForm.id);
            this.isRecordChanged(close)
                .then(ok => {
                    if (ok) {
                        recordList[targetIndex] = productForm;
                        this.setState({ edit: false, productForm, recordList });
                        resolve(true);
                    }
                })
        })
    }

    deleteProduct(product) {
        this.restAPI.delete('com.axelor.apps.sale.db.Product', product.id).then(res => {
            if (this.props.route.removeProduct) {
                this.props.route.removeProduct(product);
            }
            this.props.navigator.popPage();
        });
    }

    onRecordSwipe(record) {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.fetchNewData(record)
        this.swiper.slideTo(targetIndex, 0, true);
        this.closeEdit().then(res => {
            this.fetchNewData(record);
        });
    }

    getProduct(value) {
        const { data } = getProductType();
        return (data.find(item => item.id === value));
    }

    renderItem(product) {
        const { edit, isNew } = this.state;
        return (
            <div>
                <Card style={{ backgroundColor: '#F8F9F9' }}>
                    <div style={{ padding: '20px' }}>
                        {
                            !edit &&
                            <div style={{ textAlign: "center" }}>
                                <p className="product-info-detail-title">{product && product.name}</p>
                                <p className="product-info-detail">{product && product.code}</p>
                                <p className="product-info-detail">{product && parseFloat(product.salePrice).toFixed(2)} €</p>
                            </div>
                        }
                        {
                            edit &&
                            <div >
                                <CardField
                                    type="text"
                                    edit={edit || isNew ? true : false}
                                    title='code'
                                    onChange={(e) => this.changeField('code', e.target.value)}
                                    value={product && product.code}
                                />
                                <CardField
                                    type="text"
                                    edit={edit || isNew ? true : false}
                                    title='name'
                                    onChange={(e) => this.changeField('name', e.target.value)}
                                    value={product && product.name}
                                />
                                <CardField
                                    type="number"
                                    edit={edit || isNew ? true : false}
                                    title='salePrice'
                                    onChange={(e) => this.changeField('salePrice', e.target.value)}
                                    value={product && (product.salePrice)}
                                />
                                {/* <CheckBoxInput
                                    name="sellable"
                                    value={product && product.sellable}
                                    onValueChange={(value) => this.changeField('sellable', value)}
                                    title='sellable'
                                /> */}

                            </div>
                        }
                    </div>
                </Card>
                <div style={{ backgroundColor: 'white', padding: '5px' }}>
                    <CardTabs
                        activeColor="#2187d4"
                        titleClassName='sale-tabbar-title'
                        className="sale-item-tab"
                        active={this.state.activeTab}
                        onTabChange={(e) => this.setState({ activeTab: e })}
                        tabs={[
                            {
                                title: 'Details',
                                content:
                                    <Card style={{ width: '100%' }}>
                                        {edit ?
                                            <div>
                                                <div style={{ color: 'gray' }}>Type</div>
                                                <Select
                                                    style={{ width: '100%', paddingBottom: '5px', paddingTop: '10px' }}
                                                    className="status-select-input"
                                                    value={`${this.getProduct(product.productTypeSelect).id}`}
                                                    onChange={(e) => this.changeField('productTypeSelect', e.target.value)} >
                                                    <option disabled value></option>
                                                    {
                                                        getProductType().data.map((p, i) => (
                                                            (([null, undefined].includes(product.statusSelect) || (edit || isNew ? true : false)) &&
                                                                <option key={i} value={p.id}>{p.value}</option>
                                                            )))
                                                    }
                                                </Select>
                                            </div>
                                            :
                                            <div>
                                                <CardField title='Type' value={`${this.getProduct(product.productTypeSelect).id}`} edit={true} />
                                            </div>
                                        }
                                        <RenderManyToOne
                                            name="unit"
                                            fieldLabel='unit'
                                            placeholder='unit'
                                            targetName="name"
                                            displayField="name"
                                            value={product && (product.unit)}
                                            liveSearch={false}
                                            searchAPI={(e) => this.restAPI.search('com.axelor.apps.base.db.Unit')}
                                            onChange={(e) => this.changeField('unit', e.target.value)}
                                            edit={edit || isNew ? true : false}
                                            navigator={this.props.navigator}
                                        />
                                        <RenderManyToOne
                                            name="productFamily"
                                            fieldLabel='productFamily'
                                            placeholder='Family'
                                            targetName="name"
                                            displayField="name"
                                            value={product && (product.productFamily)}
                                            liveSearch={false}
                                            searchAPI={(e) => this.restAPI.search('com.axelor.apps.base.db.ProductFamily')}
                                            onChange={(e) => this.changeField('productFamily', e.target.value)}
                                            edit={edit || isNew ? true : false}
                                            navigator={this.props.navigator}
                                        />
                                        <RenderManyToOne
                                            name="productCategory"
                                            fieldLabel='productCategory'
                                            placeholder='Category'
                                            targetName="name"
                                            displayField="name"
                                            value={product && (product.productCategory)}
                                            liveSearch={false}
                                            searchAPI={(e) => this.restAPI.search('com.axelor.apps.base.db.ProductCategory')}
                                            onChange={(e) => this.changeField('productCategory', e.target.value)}
                                            edit={edit || isNew ? true : false}
                                            navigator={this.props.navigator}
                                        />
                                    </Card>
                            },
                            {
                                title: '',
                                content: ''
                            }
                        ]}
                    />
                </div>

            </div>
        )
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
            const { product } = this.props.route;
            const targetIndex = recordList.findIndex(record => record.id === product.id);
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
        const { isNew, edit, recordList, productForm } = this.state;
        const product_data = recordList && this.props.route && this.props.route.product ? recordList.find(r => r.id === this.props.route.product.id) : {};
        return (
            <Toolbar>
                <div className="left">
                    <Icon style={{ paddingLeft: '5px', paddingTop: '5px', color: '#0076ff' }} icon="chevron-left" onClick={() => this.goBack(true)} />
                </div >
                <div className="center" style={{ marginTop: '-20px', paddingLeft: '50px' }} >
                    <p>{productForm ? productForm.name : 'Product'}</p>
                </div>
                {isNew ?
                    <div className="right" >
                        <Icon style={{ color: '#0076ff' }} icon="fa-save" onClick={() => this.onSave()} />
                    </div>
                    :
                    !edit ?
                        <div className="right" style={{ color: '#0076ff', paddingRight: '5px' }}>
                            <Icon icon="fa-pencil" style={{ paddingRight: '10px' }} onClick={() => this.setState({ edit: !edit, activeTab: 0 })} />
                            <Icon icon="fa-trash" onClick={() => this.deleteProduct(product_data)} />
                        </div>
                        :
                        <div className="right" style={{ color: '#0076ff', paddingRight: '5px' }}>
                            <Icon icon='fa-close' style={{ paddingRight: '10px' }} onClick={() => this.closeEdit(true)} />
                            <Icon icon='fa-save' onClick={() => this.onSave(product_data)} />
                        </div>
                }
            </Toolbar>
        )
    }

    render() {
        const { isNew, productForm, recordList, isLoading } = this.state;
        console.log('recordList', recordList);
        console.log('productForm', productForm)
        // const product = recordList ? recordList.find(r => r.id === productForm.id) : {};
        // const productData = ( recordList && this.props.route && this.props.route.product ) ? recordList.find(r => r.id === this.props.route.product.id) : {};
        return (
            <Page
                renderToolbar={() => this.renderToolbar()}
                isRecordChange={() => this.isRecordChange()}
            >
                {isLoading &&
                    <div style={{ textAlign: 'center', padding: 5 }}>
                        <ProgressCircular indeterminate />
                    </div>
                }
                {isNew ?
                    this.renderItem(productForm)
                    :
                    // this.renderItem(productData)
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

export default viewProduct;
