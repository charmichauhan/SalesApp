import React from 'react';
import classNames from 'classnames';
import { ManyToOne } from '../ManyToOne';
import './style.css';

export const RenderManyToOne = (props) => {
    const { name, fieldLabel, placeholder, targetName, value, searchAPI } = props;
    return (
        <ManyToOneField
            {...props}
            style={{ width: '100%' }}
            name={name}
            title={fieldLabel}
            placeholder={placeholder}
            targetName={targetName}
            value={value}
            searchAPI={searchAPI}
            renderItem={(obj, i) =>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 0 }} className="field-input list-item list--inset__item list-item--chevron list-item--tappable">
                        <div
                            key={i}
                            className="many-to-one"
                        >
                            {obj ? obj[targetName] : placeholder}
                        </div>
                    </div>
                </div>
            }
            onChange={(e) => props.onChange(e)}
        />
    )
}

export const ManyToOneField = ({ className, edit, textClassName, value, titleClassName, fieldLabel, displayField, ...props }) => {
    return (
        <div className={classNames('card-field', className)} style={{ width: '100%' }}>
            {
                fieldLabel &&
                <div>
                    <span className={classNames("card-field-title", titleClassName)} style={{ color: 'gray' }}>{fieldLabel}</span>
                    <br />
                </div>
            }
            {
                edit ?
                    <ManyToOne
                        {...props}
                        value={value}
                    />
                    :
                    <span className={classNames("card-field-text", textClassName)} >{value ? value[displayField] : null}</span>
            }
        </div>
    );
}
