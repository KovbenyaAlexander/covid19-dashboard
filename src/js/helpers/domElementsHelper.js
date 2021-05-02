export const elementFactory = (type, attributes, ...children) => {
  const element = document.createElement(type);

  Object.keys(attributes).forEach((e) => {
    element.setAttribute(e, attributes[e]);
  });
  children.forEach((child) => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });

  return element;
};

export const clearElement = (el) => {
  const element = el;
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
};

export const getElement = (selector) => {
  const element = document.querySelector(selector);
  return element;
};

export const getElements = (selector) => {
  const elements = document.querySelectorAll(selector);
  return elements;
};
