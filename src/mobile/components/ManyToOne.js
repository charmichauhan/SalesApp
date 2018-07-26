import React, { Component } from 'react';
import classNames from 'classnames';
import { Page, ListItem, Toolbar, ToolbarButton, Radio, Icon, SearchInput, ProgressCircular } from 'react-onsenui';

export const getEventObject = (name, value) => ({ target: { name, value } });

export class ManyToOne extends Component {
    render() {
        const { title, liveSearch, placeholder, value, onChange, targetName, searchAPI, name, closeOnSelect, notFoundContent, renderItem, navigator, all, ...restProps } = this.props;
        return (
            <div
                {...restProps}
                className={classNames(restProps.className)}
            >
                {
                    React.cloneElement(renderItem(value), {
                        onClick: () => {
                            navigator.pushPage({
                                component: SelectionPage,
                                name,
                                value,
                                searchAPI,
                                title,
                                placeholder,
                                onChange,
                                notFoundContent,
                                closeOnSelect,
                                targetName,
                                liveSearch,
                                all,
                                goBack: () => navigator.popPage(),
                            }, { animation: 'slide' })
                        }
                    })
                }
            </div>
        )
    }
}

export class SelectionPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            value: props.route.value || null,
            search: '',
            loading: true,
            pager: {
                offset: 0,
                limit: 10,
                total: 0,
            },
        };
        this.is_closed = false;
    }

    componentDidMount() {
        this.fetchData()
    }
    setState(...data) {
        if (this.pageRef) {
            super.setState(...data);
        }
    }

    fetchData() {
        const { search, pager } = this.state;
        const { targetName = 'id', searchAPI } = this.props.route;
        const options = {
            fields: [targetName],
            ...pager,
        }
        if (search) {
            options.data = {
                criteria: [{ fieldName: targetName, operator: 'like', value: search }],
                operator: 'and',
            };
        }
        console.log(options);
        this.setState({ loading: true })
        // return searchAPI(options)
        //     .then(res => res.json())
        //     .then(result => {
        //         this.setState({ data: result.data, loading: false, pager: { ...pager, total, offset: options.offset } })
        //     })

        return searchAPI(options)
            .then(res => res.json())
            .then(({ data = [], total = 0 }) => {
                this.setState({ loading: false, data: data, pager: { ...pager, total, offset: options.offset } });
            });
        // .then(res => {
        //     return new Promise((resolve) => {
        //         setTimeout(() => {
        //         resolve(res);
        //         }, 200);
        //     });
        // })
        // .then(({ data = [], total = 0, status }) => {
        //     if (!Array.isArray(data)) {
        //         data = [];
        //         total = 0;
        //     }
        // this.setState(prevState => {
        //     return {
        //     data: (pager.offset === 0 ? data : [...prevState.data, ...data]),
        //     loading: false,
        //     pager: { ...pager, total, offset: options.offset } 
        //     };
        // });
        // });
    }

    searchData(value) {
        this.setState({ search: value, offset: 0 }, () => this.fetchData());
    }

    handleChange(row) {
        this.setState({ value: row }, () => {
            if (this.props.route.closeOnSelect) {
                this.close();
            }
        });
    }

    close() {
        const { value } = this.state;
        const { targetName, all, onChange, name, goBack } = this.props.route;
        let obj = {};
        if (all) {
            obj = value;
        } else {
            // obj = { row_id: value.row_id || '', id: value.id, [targetName]: value[targetName] }
            obj = { id: value.id, [targetName]: value[targetName] }
        }
        onChange(getEventObject(name, obj));
        if (!this.is_closed) {
            this.is_closed = true;
            goBack();
        }
    }

    renderRow(row, index) {
        const { value } = this.state;
        const { targetName } = this.props.route;
        const isSelected = value && value.id && value.id.toString() === row.id.toString();
        return (
            <ListItem key={row.id} tappable onClick={() => this.handleChange(row)}>
                <label className='left'>
                    <Radio
                        inputId={`radio-${row.id}`}
                        checked={isSelected}
                    />
                </label>
                <label htmlFor={`radio-${row.id}`} className='center'>
                    {row[targetName]}
                </label>
            </ListItem>
        )
    }

    onLoadMore(done) {
        const { pager } = this.state;
        pager.offset = pager.offset + pager.limit;
        const hasMore = pager.total > pager.offset;
        if (hasMore) {
            console.log('hasMore', hasMore)
            console.log('pager', pager)
            this.setState({ loading: true, pager: { ...pager } }, () => {
                this.fetchData().then(done);
            });
            return (this.state.loading && <div style={{ textAlign: 'center', paddingBottom: 5 }}>
                <ProgressCircular indeterminate />
            </div>)
        } else {
            console.log('else')
            done();
        }
    }

    renderToolbar() {
        const { goBack, title } = this.props.route;
        return (
            <Toolbar style={{ background: '#fff' }}>
                <div className='left'>
                    <ToolbarButton onClick={() => goBack()} style={{ color: '#000' }}>
                        <Icon icon='md-arrow-left' />
                    </ToolbarButton>
                </div>
                <div className='center' style={{ color: '#000', flex: 1 }}>{title}</div>
                <div className='right'>
                    <ToolbarButton onClick={() => this.close()} style={{ color: '#000', fontSize: 36, padding: 0, marginRight: 20 }}>
                        <Icon icon='md-check' />
                    </ToolbarButton>
                </div>
            </Toolbar>
        );
    }

    render() {
        const { data, search, loading } = this.state;
        const { placeholder } = this.props.route;
        return (
            <Page
                ref={e => this.pageRef = e}
                renderToolbar={() => this.renderToolbar()}
                onInfiniteScroll={(done) => this.onLoadMore(done)}
            >
                <div>
                    <div style={{ padding: 12 }}>
                        <SearchInput value={search} style={{ width: '100%' }} placeholder={placeholder} onChange={(e) => this.searchData(e.target.value)} />
                    </div>
                    {
                        loading &&
                        <div style={{ textAlign: 'center', padding: 5 }}>
                            <ProgressCircular indeterminate />
                        </div>
                    }
                    {
                        data.map((e, i) => this.renderRow(e, i))
                    }
                    {
                        (!loading && data.length === 0) &&
                        <ListItem>
                            Sorry! Content not found
                        </ListItem>
                    }
                </div>
            </Page>
        );
    }
}
