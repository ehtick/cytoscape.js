/* eslint-disable no-console, no-unused-vars */
/* global $, cytoscape, options, cy, networks */

var cy;

const paramDefs = {
  networkID: {
    default: 'em-web',
    control: '#network-select'
  },
  bgcolor: {
    default: 'white',
    control: '#bg-color-select'
  },
  webgl: {
    default: 'true',
    control: '#webgl-check'
  },
  webglDebugShowAtlases: {
    default: false,
    control: '#atlas-checkbox'
  },
  webglTexSize: {
    default: 4096,
    control: '#texture-size-select'
  },
  webglTexRows: {
    default: 24,
    control: '#texture-rows-select'
  },
  webglBatchSize: {
    default: 1024,
    control: '#batch-size-select'
  },
  webglTexPerBatch: {
    default: 12,
    control: '#texture-units-select'
  },
};



(function(){

  const params = {};

  // Load URL params
  const urlParams = new URLSearchParams(window.location.search);
  for(const p of Object.keys(paramDefs)) {
    const def = paramDefs[p];
    params[p] = urlParams.get(p) || def.default;
  }

  console.log('params', params);
  $('#cytoscape').style.backgroundColor = params.bgcolor;

  // Load network and style
  function loadNetwork(elements, style) {
    options = {
      container: $('#cytoscape'),
  
      renderer: {
        name: 'canvas',
        showFps: true,
        webgl: params.webgl === 'true',
        webglDebug: true,
        webglDebugShowAtlases: params.webglDebugShowAtlases === 'true',
        webglTexSize: params.webglTexSize,
        webglTexRows: params.webglTexRows,
        webglBatchSize: params.webglBatchSize,
        webglTexPerBatch: params.webglTexPerBatch,
      },

      style: style,
      elements: elements,
      layout: network.layout
    };
    options.layout.animate = false;
    cy = cytoscape(options);
  }

  const network = networks[params.networkID];
  const style = network.style;

  if(style && style.file) {
    // style is in a separate file
    console.log('loading style from file: ', style.file);
    Promise.all([
      fetch(network.url).then(res => res.json()),
      fetch(style.file).then(res => res.json())
    ]).then(([networkJson, styleJson]) => {
      loadNetwork(networkJson.elements, styleJson.style);
    });
  } else {
    // style is in the same file as the network
    fetch(network.url)
    .then(res => res.json())
    .then(networkJson => {
      loadNetwork(networkJson.elements, networkJson.style);
    });
  }

  // Initialize controls
  for(const [networkID, network] of Object.entries(networks)) {
    const option = document.createElement('option');
    option.value = networkID;
    option.innerHTML = `${network.desc} (${network.nodes} nodes, ${network.edges} edges)`;
    $("#network-select").appendChild(option);
  }

  for(const p of Object.keys(paramDefs)) {
    const control = $(paramDefs[p].control);
    if(control.type == 'checkbox') {
      control.checked = params[p] === 'true';
      control.addEventListener('click', () => reloadPage());
    } else {
      control.value = params[p];
      control.addEventListener('change', () => reloadPage());
    }
  }

  
  // Add listeners to controls
  function reloadPage(reset = false) {
    const { origin, pathname } = window.location;
    if(reset) {
      window.location.href = origin + pathname;
      return;
    }

    const urlParams = new URLSearchParams();
    for(const p of Object.keys(paramDefs)) {
      const control = $(paramDefs[p].control);
      const value = control.type == 'checkbox' ? control.checked : control.value;
      urlParams.set(p, value);
    }

    window.location.href = origin + pathname + '?' + urlParams.toString();
  }

  $('#hide-commands').addEventListener('click', () => {
    document.body.classList.remove('commands-shown');
    document.body.classList.add('commands-hidden');
		cy.resize();
  });

  $('#show-commands').addEventListener('click', () => {
    document.body.classList.add('commands-shown');
    document.body.classList.remove('commands-hidden');
		cy.resize();
  });
  
  $("#fit-button").addEventListener('click', () => cy.fit());
  $("#reset-button").addEventListener('click', () => reloadPage(true));

  $("#delete-button").addEventListener('click', () => {
    cy.remove(':selected');
  });

  $("#animate-button").addEventListener('click', () => {
    const nodes = cy.nodes(':selected');
    nodes.forEach(n => {
      const w = n.width();
      n.animate({
        style: { 'width': w + 100 }
      }, {
        duration: 1000
      })
      .delay(1000)
      .animate({
        style: { 'width': w }
      }, {
        duration: 1000
      });
    });
  });

  $("#select-button").addEventListener('click', () => {
    cy.nodes().select();
  });

  $("#gc-button").addEventListener('click', () => {
    cy.gc();
  });

})();
