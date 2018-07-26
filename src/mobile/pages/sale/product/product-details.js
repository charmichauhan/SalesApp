import React, {Component} from 'react';
import { Card, Page, Icon, Toolbar, Select } from 'react-onsenui';
import {CardField} from '../../../components/Fields';
import ProductsList from './list-products';
import {ManyToOneField} from '../../../components/RenderManyToOne/index';
import restAPI from '../../../rest.api';

const RenderUnitTaxField = (props) => {
    const { value, fieldLabel } = props;
    return (
      <ManyToOneField
        {...props}
        edit
        style={{ width: '100%' }}
        className="inline select-control"
        title={fieldLabel}
        targetName="name"
        value={value && (value || null)}
        onChange={(e) => props.onChange(e)}
        renderItem={(obj, i) =>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 0 }} className="field-input list-item list--inset__item list-item--chevron list-item--tappable">
              <div
                key={i}
                className="many-to-one"
              >
                {obj ? obj.name : ''}
              </div>
            </div>
          </div>
        }
      />
    );
}

class ProductDetailsPage extends Component{
    constructor(props) {
        super(props);
        this.state = {
          quantity: 1,
          rate: 0.00,
          productName: '',
          product: {},
          discountAmount: 0.00,
          discountTypeSelect: '3',
          tax: {
            id: 11,
            name: 'TVA Coll. (V) taux normal : 0.200 : 2014-01-01'
          },
          oldExtotal: 0,
          oldIxtotal: 0,
          edit: false
        }
        this.restAPI = new restAPI();
    }

    componentDidMount() {
        if (this.props.route.data) {
            //edit
            const { data } = this.props.route;
            this.setState({edit: true},data[0]);
        }
        else if (this.props.route.product) {
            //add
            const { product } = this.props.route;
            this.setState({ edit: true,productName: product.name, rate: product.salePrice, quantity: 1, unit: product.unit, product: { id: product.id } });
        }
    }

    onInputChange(name, value) {
        this.setState({ [name]: value });
    }
  
    countSubtotal() {
        let { rate, quantity } = this.state;
        let subTotal = parseFloat(rate) * parseFloat(quantity);
        return isNaN(subTotal) ? 0.00 : subTotal;
    }
    
    countTotalWt() {
        const { discountAmount = 0, discountTypeSelect = 3 } = this.state;
        let subTotal = this.countSubtotal();
        let totalWT = parseInt(discountTypeSelect, 10) === 1 ? subTotal - (subTotal * parseFloat(discountAmount) / 100) : subTotal <= 0 ? 0 : subTotal - parseFloat(discountAmount);
        return isNaN(totalWT) ? 0.00 : totalWT;
    }
    
    countTotalATI() {
        const { tax } = this.state;
        const taxRate = !!tax ? tax.name.substring(tax.name && tax.name.indexOf(':') + 1, tax.name.lastIndexOf(':')) : '0';
        let totalWT = this.countTotalWt();
        return (totalWT * taxRate) + totalWT;
    }
    
    onSave() {
        const { tax } = this.state;
        let tax_rate = !!tax ? tax.name.substring(tax.name && tax.name.indexOf(':') + 1, tax.name.lastIndexOf(':')) : '0';
        let amountTax = tax_rate * this.countTotalWt();
        const exTaxTotal = this.countTotalWt();
        const inTaxTotal = this.countTotalATI();
        const discount_price = this.countTotalWt();
        this.props.route.addProduct({ ...this.state, inTaxTotal, exTaxTotal, tax_rate, discount_price, amount_tax: amountTax });
        this.props.navigator.popPage();
    }

    onAddProduct(product) {
        product.salePrice = parseFloat(product.salePrice || '').toFixed(2);
        this.setState({ rate: product.salePrice, productName: product.name, unit: product.unit, product: { id: product.id } });
    }

    renderToolbar() {
        return (
            <Toolbar>
                <div className="left" >
                    <Icon style={{ paddingLeft: '5px', color: '#0076ff' }} icon="fa-chevron-left" onClick={() => this.props.navigator.popPage()} />
                </div >
                <div className="center">
                    <p style={{ margin: 'auto', paddingLeft: '50px' }}>{this.state.productName || 'Product-details'}</p>
                </div>
                <div className="right round-icon" >
                    <Icon icon="fa-save" style={{ paddingRight: '5px', color: '#0076ff' }} onClick={() => this.onSave()} />
                </div>
            </Toolbar>
        )
    }

    render() {
        const { quantity, rate, tax, unit, discountAmount, discountTypeSelect } = this.state;
        const { statusSelect } = this.props.route.order || this.props.route.orderForm;
        console.log('statusSelect', statusSelect);
        let optionList=[{ text: '%', id: "1" }, { text: 'Fixed', id: "2" }, { text: 'No Discount', id: "3" }];
         
        return(
            <Page
                renderToolbar={() => this.renderToolbar()}
            >
            <Card>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: 'gray', marginTop: 10 }}>Product
                    <div style={{ padding: 0}} className="field-input list-item list--inset__item list-item--chevron list-item--tappable">
                        <div className="many-to-one" style={{ marginTop: 5 }} onClick={() => (statusSelect === '1' || statusSelect === 1) && this.props.navigator.pushPage({
                            key: Date.now(), component: ProductsList, editProduct: (product) => this.onAddProduct(product)
                            },
                            { animation: 'none' })}>{this.state.productName ||'selectProduct'}
                        </div>
                    </div>
                </div>
                </div>
                <br/>
                <CardField
                    type='number'
                    title='Rate'
                    onChange={(e) => this.onInputChange('rate', e.target.value)}
                    value={rate || ''}
                    edit={this.state.edit}
                />
                <br/>
                <CardField
                    type="number"
                    title='Quantity'
                    value={quantity}
                    edit={this.state.edit}
                    onChange={(e) => this.onInputChange('quantity', e.target.value)}
                />
                <RenderUnitTaxField
                    value={unit}
                    placeholder="Unit"
                    fieldLabel='Unit'
                    displayField="name"
                    edit={this.state.edit}
                    onChange={(e) => this.onInputChange('unit', e.target.value)}
                    searchAPI={(e) => this.restAPI.search('com.axelor.apps.base.db.Unit')}
                    navigator={this.props.navigator}
                />
                <RenderUnitTaxField
                    value={tax}
                    placeholder='Tax'
                    fieldLabel='Tax'
                    displayField="name"
                    edit={this.state.edit}
                    onChange={(e) => this.onInputChange('tax', e.target.value)}
                    searchAPI={(e) => this.restAPI.search('com.axelor.apps.account.db.TaxLine')}
                    navigator={this.props.navigator}
                />
                <CardField title='TotalWT' value={parseFloat(this.countTotalWt()).toFixed(2) + ' €'} edit={this.state.edit} />
                <CardField title='TotalATI' value={parseFloat(this.countTotalATI()).toFixed(2) + ' €'} edit={this.state.edit}/>
                <br/>
                <div className="partner-type-selection" >
                    <span className='field-title' style={{ marginTop: 10 }}>discountType</span>
                    <br/>
                    <Select
                        style={{ width: '90%' }}
                        name="discountTypeSelect"
                        value={discountTypeSelect}
                        onChange={(e) => this.onInputChange('discountTypeSelect', e.target.value)} >
                        <option disabled value></option>
                        {
                            optionList.map((s, i) => (
                                <option key={i} value={s.id}>{s.text}</option>
                            ))
                        }
                    </Select>
                </div>
                {
                (discountTypeSelect === '1' || discountTypeSelect === 1 || discountTypeSelect === '2' || discountTypeSelect === 2) &&
                    <CardField
                        edit={this.state.edit}
                        title='DiscountRate'
                        type='number'
                        onChange={(e) => this.onInputChange('discountAmount', e.target.value)}
                        value={discountAmount || '0.00'}
                    />
                }
                {
                    (discountTypeSelect === '1' || discountTypeSelect === 1 || discountTypeSelect === '2' || discountTypeSelect === 2) && discountAmount > 0 &&
                        <CardField title={'priceDiscounted'} value={(this.countTotalATI())} edit={this.state.edit} />
                }
            </Card>
            </Page>
        )
    }
}

export default ProductDetailsPage;  
