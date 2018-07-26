import React from 'react';
import { Input, TextInput } from 'react-onsenui';
import classNames from 'classnames';
import moment from 'moment';
import './style.css';

export const CardField = ({ className, title, value, titleClassName, placeholder, edit, onChange, type, style, ...props }) => (
    <div className={classNames('card-field', className)} style={{ ...style }}>
        {
            <span className={classNames("card-field-title", titleClassName)} style={{ color: 'gray' }}>{title}</span>
        }
        {
            edit ?
                <div>
                    <Input
                        style={{ width: "100%", paddingBottom: '5px', paddingTop: '5px' }}
                        type={type}
                        value={[null, undefined].includes(value) ? '' : `${value}`}
                        onChange={(e) => onChange(e)}
                        modifier="underbar"
                        placeholder={title}
                    />
                </div>
                :
                ''
        }
    </div>
);

export const DateField = ({ className, title, value, titleClassName, textClassName, edit, onChange, dateFormat }) => (
    // console.log('hfsfb', moment(value).isValid() ? value && moment(value).format('YYYY-MM-DD') : ''),
    <div className={classNames('card-field', className)} style={{ width: '100%', paddingTop: '5px' }}>
        {
            <div>
                <span className={classNames("card-field-title", titleClassName)} style={{ color: 'gray' }}>{title}</span>
                <br />
            </div>
        }
        {
            edit ?
                <TextInput style={{ paddingBottom: '5px', paddingTop: '5px' }} type='date' value={moment(value).isValid() ? value && moment(value).format('YYYY-MM-DD') : ''} onValueChange={(e) => onChange({ target: { value: e } })} />
                :
                <span style={{ paddingBottom: '5px' }} className={classNames("card-field-text", textClassName)}>{moment(value).isValid() ? moment(value).format(dateFormat || 'DD MMM YYYY') : ''}</span>
        }
    </div>
);