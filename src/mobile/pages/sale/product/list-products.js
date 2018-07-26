import React, { Component } from 'react';
import { Page, Icon, List, ListItem, Toolbar, SearchInput, ProgressCircular } from 'react-onsenui';
import viewProduct from './view-product';
import RestAPI from '../../../rest.api';
import ProductDetailsPage from './product-details';

class ProductsList extends Component {

    constructor(props) {
        super(props)
        this.state = {
            data: [],
            searchValue: '',
            isLoading: false
        }
        this.restAPI = new RestAPI();
    }

    getAllData() {
        this.setState({ isLoading: true })
        const { searchValue } = this.state;
        let options = {};
        if (searchValue) {
            options.data = {
                criteria: [
                    {
                        operator: "or",
                        criteria: [{ fieldName: "name", operator: "like", value: searchValue },
                        ]
                    },
                ],
            }
        }
        this.restAPI.search('com.axelor.apps.base.db.Product', { ...options })
            .then((res) => res.json())
            .then((result) =>
                this.setState({
                    data: result.data, isLoading: false
                }),
        )
    }

    componentDidMount() {
        this.getAllData()
    }

    removeProduct(product) {
        let { data } = this.state;
        const index = data.findIndex(p => p.id === product.id);
        data.splice(index, 1);
        this.setState({ data });
    }

    updateProduct(product) {
        const { data } = this.state;
        let index = data.findIndex(c => c.id === product.id);
        data[index] = { ...product };
        this.setState({ data: [...data] })
    }

    addProduct(product) {
        let { data } = this.state;
        data.unshift(product)
        this.setState({ data });
    }

    onAddProduct(product) {
        // add new product in isNew of viewQuotation -> list (+)
        this.props.navigator.pushPage({
            component: viewProduct,
            data: { product },
            addProduct: (product) => this.addProduct(product),
            removeProduct: (product) => this.removeProduct(product),
            updateProduct: (product) => this.updateProduct(product),
        }, { animation: 'none' });
    }

    onProduct(product) {
        // add new product in isNew of viewQuotation -> listitem click
        const { addProduct, editProduct, data } = this.props.route;
        if (addProduct) {
            this.props.navigator.replacePage({ product, component: ProductDetailsPage, addProduct, order: data }, { animation: 'none' })
        }
        else if (editProduct) {
            editProduct(product);
            this.props.navigator.popPage();
        }
        else {
            this.props.navigator.pushPage({
                key: Date.now(),
                component: viewProduct,
                product,
                data: this.state.data,
                removeProduct: (product) => this.removeProduct(product),
            }, { animation: 'none' });
        }
    }

    onListItemClick(item) {
        return this.onProduct(item);
    }

    renderRow(row, index) {
        return (
            <ListItem
                key={index}
                style={{ padding: '20px' }}
                onClick={() => this.onListItemClick(row)}
            >
                <div style={{ fontSize: '18px', display: 'flex' }}>
                    <div style={{ paddingRight: '30px' }}>
                        {row.name}
                        <br />
                        <div style={{ fontSize: '16px', color: 'gray' }}>
                            {parseFloat(row.salePrice).toFixed(2)}
                        </div>
                    </div>
                    {/* <div>
                        {
                            row.picture &&
                            <img src={row.picture} style={{ width: 75, height: 75 }} alt="product img" />
                        }
                    </div> */}
                </div>
            </ListItem>
        )
    }

    renderListSearch({ placeholder = 'Search by name...' } = {}) {
        const { searchValue } = this.state;
        const onKeywordChange = (e) => {
            this.setState({ searchValue: e.target.value, offset: 0 }, () => this.getAllData());
        }
        return (
            <div>
                <SearchInput
                    style={{ width: '90%', height: '50px', borderRadius: '20px', marginLeft: '-20px' }}
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={onKeywordChange}
                />
            </div>
        );
    }

    renderToolbar() {
        return (
            <Toolbar>
                <div className="left" >
                    <Icon style={{ paddingLeft: '5px', color: '#0076ff' }} icon="fa-chevron-left" onClick={() => this.props.navigator.popPage()} />
                </div >
                <div className="center">
                    <p style={{ margin: 'auto', paddingLeft: '50px' }}>Products</p>
                </div>
                <div className="right round-icon" >
                    <Icon icon="md-plus" style={{ paddingRight: '5px', color: '#0076ff' }} onClick={() => this.onAddProduct()} />
                </div>
            </Toolbar>
        )
    }

    render() {
        const { isLoading } = this.state;
        return (
            <Page
                renderToolbar={() => this.renderToolbar()}
            >
                <div style={{ marginTop: 20, paddingLeft: '75px' }}>
                    {this.renderListSearch()}
                </div>
                {
                    isLoading &&
                    <div style={{ textAlign: 'center', padding: 5 }}>
                        <ProgressCircular indeterminate />
                    </div>
                }
                <section>
                    <List
                        style={{ marginTop: 20 }}
                        dataSource={this.state.data}
                        renderRow={(row, index) => this.renderRow(row, index)}
                    />
                </section>
            </Page>
        )
    }
}

export default ProductsList;
