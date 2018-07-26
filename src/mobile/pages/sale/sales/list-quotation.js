import React, { Component } from 'react';
import { Page, Icon, ProgressCircular, List, ListItem, Toolbar, Button, SearchInput } from 'react-onsenui';
import viewQuotation from './viewQuotation';
import RestAPI from '../../../rest.api';

const statusSelect = {
    1: 'Draft',
    2: 'Finalize',
    3: 'orderConfirmed',
    4: 'Finished',
    5: 'Canceled',
}

const Tabbar = ({ tabs, value, onChange }) => {
    if (tabs.filter(t => t.value === value).length === 0 && tabs && tabs.length) {
        value = tabs[0].value;
    }
    return (
        <div>
            <div className="tabbar tabbar--top tabbar--material">
                {
                    tabs.map((tab, i) => (
                        <React.Fragment key={i}>
                            <Button style={{ backgroundColor: 'DodgerBlue' }} className="tabbar__item tabbar--material__item" onClick={() => onChange(tab.value)}>
                                {tab.text}
                            </Button>
                        </React.Fragment>
                    ))
                }
            </div>
        </div>
    )
}

class QuotationList extends Component {

    constructor(props) {
        super(props)
        this.state = {
            data: [],
            filter: 0,
            offset: 0,
            limit: 10,
            total: 0,
            searchValue: '',
            isLoading: false,
            loadMore: true
        }
        this.restAPI = new RestAPI();
    }

    getAllData() {
        this.setState({ isLoading: true })
        const { searchValue, filter, offset, limit } = this.state;
        let options = {
            offset,
            limit
        }
        if (filter === 0) {
            if (searchValue) {
                options.data = {
                    criteria: [
                        {
                            operator: "or",
                            criteria: [{ fieldName: "clientPartner.fullName", operator: "like", value: searchValue },
                            ]
                        },
                    ],
                    operator: 'and',
                    _domain: null,
                    _domainContext: {}
                };
            }
            else { options.data = {} }
        }
        else if (searchValue) {
            options.data = {
                criteria: [
                    {
                        operator: "or",
                        criteria: [{ fieldName: "clientPartner.fullName", operator: "like", value: searchValue },
                        { fieldName: "exTaxTotal", operator: "=", value: searchValue },
                        { fieldName: "inTaxTotal", operator: "=", value: searchValue },
                        ]
                    },
                    {
                        operator: "and",
                        criteria: [{ fieldName: "statusSelect", operator: "=", value: filter }]
                    }
                ],
                operator: 'and',
                _domain: null,
                _domainContext: {}
            };
        }
        else {
            options.data = {
                criteria: [
                    {
                        operator: "and",
                        criteria: [{ fieldName: "statusSelect", operator: "=", value: filter }]
                    }
                ],
                operator: 'and',
                _domain: null,
                _domainContext: {}
            }
        }
        this.restAPI.search('com.axelor.apps.sale.db.SaleOrder', { ...options })
            .then((res) => res.json())
            .then(res => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(res);
                    }, 200);
                });
            })
            .then(({ data = [], total = 0, status }) => {
                // if err
                if (!Array.isArray(data)) {
                    data = [];
                    total = 0;
                }
                this.setState(prevState => {
                    return {
                        data: (offset === 0 ? data : [...prevState.data, ...data]),
                        offset,
                        total,
                        isLoading: false,
                    };
                });
            })
        // .then((res) => res.json())
        // .then((result) =>
        //     this.setState({
        //         data: result.data, isLoading: false
        //     })
        // )
    }

    componentDidMount() {
        this.restAPI.login('admin', 'admin')
            .then(() => this.getAllData())
    }

    addQuotation(order) {
        this.props.navigator.pushPage({
            component: viewQuotation,
            order,
            data: this.state.data,
        })
    }

    removeQuotation(order) {
        let { data } = this.state;
        const index = data.findIndex(p => p.id === order.id);
        data.splice(index, 1);
        this.setState({ data });
    }

    updateQuotation(order) {
        const { data } = this.state;
        let index = data.findIndex(c => c.id === order.id);
        data[index] = { ...order };
        this.setState({ data: [...data] })
    }

    onListItemClick(item) {
        this.props.navigator.pushPage({
            component: viewQuotation,
            order: item,
            data: this.state.data,
            removeQuotation: (order) => this.removeQuotation(order),
            updateQuotation: (order) => this.updateQuotation(order),
            key: Date.now()
        })
    }

    renderRow(row, index) {
        return (
            <ListItem
                key={index}
                style={{ padding: '15px' }}
                onClick={() => this.onListItemClick(row)}
            >
                <div style={{ fontSize: '18px' }}>
                    {row.clientPartner.fullName}
                    <br />
                    <div style={{ fontSize: '16px', color: 'gray' }}>
                        {row.exTaxTotal}
                        <br />
                        {row.inTaxTotal}
                        <br />
                        {statusSelect[row.statusSelect]}
                    </div>
                </div>
            </ListItem>
        )
    }

    renderListSearch({ placeholder = 'Search...' } = {}) {
        const { searchValue } = this.state;
        const onKeywordChange = (e) => {
            this.setState({ searchValue: e.target.value, offset: 0 }, () => this.getAllData());
        }
        return (
            <div key="0" >
                <SearchInput
                    style={{ width: '90%', height: '50px', borderRadius: '20px', marginLeft: '-20px' }}
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={onKeywordChange}
                />
            </div>
        );
    }

    getListTabsData() {
        return [
            { text: 'All', value: 0 },
            { text: 'Draft', value: 1 },
            { text: 'Finalize', value: 2 },
            { text: 'Others', value: 3 },
        ];
    }

    onTabChange(newIndex) {
        const { filter } = this.state;
        if (filter !== newIndex) {
            this.setState({ filter: newIndex }, () => this.getAllData());
        }
    }

    renderListTabsFilter() {
        const { filter } = this.state;
        return (
            <Tabbar
                tabs={this.getListTabsData()}
                value={filter}
                onChange={(e) => this.onTabChange(e)}
            />
        )
    }

    onLoadMore(done) {
        const { offset, limit, total, loadMore } = this.state;
        const newOffset = offset + limit;
        const hasMore = newOffset < total;
        if (hasMore) {
            console.log('newOffset, limit, total', newOffset, limit, total)
            this.setState({ loadMore: true, offset: newOffset, limit, total }, () => {
                this.getAllData()
            });
            return (loadMore && <div style={{ textAlign: 'center', paddingBottom: 5 }}>
                <ProgressCircular indeterminate />
            </div>)
        } else {
            console.log('else')
            done();
        }
    }

    renderToolbar() {
        return (
            <Toolbar>
                <div className="left" >
                    <Icon style={{ paddingLeft: '5px', color: '#0076ff' }} icon="fa-chevron-left" onClick={() => this.props.navigator.popPage()} />
                </div >
                <div className="center">
                    <p style={{ margin: 'auto', paddingLeft: '50px' }}>Quotations</p>
                </div>
                <div className="right round-icon" >
                    <Icon icon="md-plus" style={{ paddingRight: '5px', color: '#0076ff' }} onClick={() => this.addQuotation()} />
                </div>
            </Toolbar>
        )
    }

    render() {
        const { isLoading, loadMore, data } = this.state;
        return (
            <Page
                renderToolbar={() => this.renderToolbar()}
                onInfiniteScroll={(done) => this.onLoadMore(done)}
            >
                <div style={{ marginTop: 20, paddingLeft: '75px' }}>
                    {this.renderListSearch()}
                </div>
                <div style={{ marginTop: 20 }}>
                    {this.renderListTabsFilter()}
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
                        dataSource={data}
                        renderRow={(row, index) => this.renderRow(row, index)}
                    />
                </section>
                {
                    (!loadMore && data.length === 0) &&
                    <ListItem>
                        Sorry! Content not found
                    </ListItem>
                }
            </Page>
        )
    }
}

export default QuotationList;
