import React from 'react';

const Sidebar = ({ menuItems, activeTab, setActiveTab }) => {
  return (
    <aside>
      <ul>
        {menuItems.map((item) => (
          <li
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => setActiveTab(item.id)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;