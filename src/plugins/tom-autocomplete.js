// sdk/components/tom-autocomplete.js
// import TomSelect from 'tom-select';

window.setupTomSelect = function setupTomSelect({
  selectorId,
  type,
  initialItems = [],
  fetchSuggestions,
  onAdd,
  onRemove
}) {
  const el = document.getElementById(selectorId);
  if (!el) return;

  // Add pre-selected items
  initialItems.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.text = item.name || item.email || item.id; // Use name/email if available, fallback to id
    opt.selected = true;
    // Store the full item data for icon access
    opt.setAttribute('data-raw', JSON.stringify(item));
    el.appendChild(opt);
  });

  const tom = new TomSelect(el, {
    plugins: ['remove_button'], // only show 'X', no backspace delete
    persist: false,
    maxItems: null,
    loadThrottle: 300, // Add throttling to prevent too many API calls
    onInitialize: function() {
      // Process existing options to ensure raw data is available
      Object.keys(this.options).forEach(key => {
        const option = this.options[key];
        const optionElement = el.querySelector(`option[value="${key}"]`);
        if (optionElement && optionElement.getAttribute('data-raw')) {
          try {
            option.raw = JSON.parse(optionElement.getAttribute('data-raw'));
          } catch (e) {
            console.warn('Failed to parse raw data for option:', key);
          }
        }
      });
    },
    render: {
      option: (data, escape) => {
        const getAvatarHtml = (size) => {
          if (!data.raw?.icon) {
            // No icon provided - show initials
            const initials = (data.raw?.name || data.text || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return `<div class="user-avatar-fallback" style="width: ${size}px; height: ${size}px; margin-right: 8px; background: #4f46e5; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: ${Math.floor(size/2.5)}px; font-weight: 500;">${initials}</div>`;
          }
          
          // Try to load image with fallback to initials
          const initials = (data.raw?.name || data.text || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          return `<img src="${data.raw.icon}" 
                      class="user-avatar" 
                      style="width: ${size}px; height: ${size}px; border-radius: 50%; margin-right: 8px; object-fit: cover;" 
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" 
                      onload="this.nextElementSibling.style.display='none';" />
                  <div class="user-avatar-fallback" 
                       style="width: ${size}px; height: ${size}px; margin-right: 8px; background: #4f46e5; color: white; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: ${Math.floor(size/2.5)}px; font-weight: 500;">${initials}</div>`;
        };
        
        return `<div style="display: flex; align-items: center;">${getAvatarHtml(20)}${escape(data.text)}</div>`;
      },
      item: (data, escape) => {
        const getAvatarHtml = (size) => {
          if (!data.raw?.icon) {
            // No icon provided - show initials
            const initials = (data.raw?.name || data.text || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return `<div class="user-avatar-fallback" style="width: ${size}px; height: ${size}px; margin-right: 6px; background: #4f46e5; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: ${Math.floor(size/2.5)}px; font-weight: 500;">${initials}</div>`;
          }
          
          // Try to load image with fallback to initials
          const initials = (data.raw?.name || data.text || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          return `<img src="${data.raw.icon}" 
                      class="user-avatar" 
                      style="width: ${size}px; height: ${size}px; border-radius: 50%; margin-right: 6px; object-fit: cover;" 
                      crossorigin="anonymous"
                      referrerpolicy="no-referrer"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" 
                      onload="this.nextElementSibling.style.display='none';" />
                  <div class="user-avatar-fallback" 
                       style="width: ${size}px; height: ${size}px; margin-right: 6px; background: #4f46e5; color: white; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: ${Math.floor(size/2.5)}px; font-weight: 500;">${initials}</div>`;
        };
        
        return `<div style="display: flex; align-items: center;">${getAvatarHtml(16)}${escape(data.text)}</div>`;
      },
      loading: () => `<div class="loading">Searching...</div>`,
      no_results: () => `<div class="no-results">No results found</div>`
    },
    load: function(query, callback) {
      if (!query.length) return callback();
      
      // Set loading state
      this.loading = true;
      
      fetchSuggestions(query, type)
        .then(results => {
          this.loading = false;
          if (results && results.length > 0) {
            callback(results.map(e => ({ value: e.id, text: e.id, raw: e })));
          } else {
            callback([]);
          }
        })
        .catch(error => {
          this.loading = false;
          console.error('Error fetching suggestions:', error);
          callback([]);
        });
    },
    onItemAdd: (value) => {
      const optionData = tom.options[value]?.raw || { id: value };
      onAdd(optionData, type);
    },
    onItemRemove: (value) => {
      onRemove({ id: value }, type);
    }
  });

  // Now it only prevents backspace when it would delete selected items
  tom.control_input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      const inputValue = tom.control_input.value;
      const hasSelectedItems = tom.items.length > 0;
      
      // Only prevent backspace if input is empty AND there are selected items
      if (inputValue === '' && hasSelectedItems) {
        e.preventDefault(); 
      }
      // Allow normal text editing when there's text in the input
    }
  });

  return tom;
}
