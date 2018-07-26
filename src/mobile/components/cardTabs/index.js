import React from 'react';
import classNames from 'classnames';
import './style.css'

export const CardTabs = ({ className, style, active, onTabChange, activeColor, titleClassName, tabs }) => {
  const isSingle = tabs.length === 1;
  return (
    <div>
      <div style={{ ...style }} className={classNames('tabber-item', className)} >
        {tabs.map((tab, id) => {
          return <div key={id}>
            <span
              style={{ padding: '5px 40px 10px 20px', borderBottom: (active === id && isSingle) ? `3px solid transparent` : ((active === id && activeColor) ? `3px solid ${activeColor}` : '') }}
              onClick={() => onTabChange(id)}
              className={classNames('tabber-title', active === id ? 'active-tabber-tab' : 'inactive-tabber-tab', titleClassName)}
            >
              {tab.title}
            </span>
          </div>
        })}
      </div>
      <div className={classNames('tabber-view', className)}>
        {tabs[active].content}
      </div>
    </div>
  )
}

export default CardTabs;
