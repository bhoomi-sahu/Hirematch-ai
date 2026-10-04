import React from 'react';

const Card = ({ children, className = '', hover = false, as: Tag = 'div', ...rest }) => (
  <Tag
    className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${
      hover ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5' : ''
    } ${className}`}
    {...rest}
  >
    {children}
  </Tag>
);

export default Card;
