import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Page, BottomToolbar, Icon, Row, Col } from 'react-onsenui';
import Logo from './logo.png';
import './style.css';
import QuotationList from '../sale/sales/list-quotation'
import ProductList from '../sale/product/list-products'

class HomePage extends Component {

  salePage() {
    this.props.navigator.pushPage({
      component: QuotationList
    })
  }
  productPage() {
    this.props.navigator.pushPage({
      component: ProductList
    })
  }
  render() {
    return (
      <Page
        {...this.props}
        title={
          <div className='center adjust-center'>
            Axelor
          </div>
        }
      >
        <div className="home-content">
          <h1 style={{ textAlign: 'center', marginTop: 50, marginBottom: -10 }}>
          </h1>
          <div className="home-img">
            <img src={Logo} alt="Axelor Logo" />
          </div>
        </div>
        <BottomToolbar>
          <Icon icon="cart" />
        </BottomToolbar>
        <BottomToolbar style={{ height: "80px" }}>
          <Row style={{ paddingLeft: '30px', marginTop: '15px' }}>
            <Col className="left">
              <Icon icon="fa-cart-plus" onClick={() => this.salePage()} />
              <p>Sale</p>
            </Col>
            <Col className="center">
              <Icon icon="fa-shopping-basket" onClick={() => this.productPage()} />
              <p>Product</p>
            </Col>
          </Row>
        </BottomToolbar>
      </Page>
    );
  }
}

HomePage.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

export default HomePage;

