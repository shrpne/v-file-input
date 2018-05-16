import FileInput from './FileInput';

function plugin (Vue) {
    Vue.component('file-input', FileInput);
}

// Install by default if using the script tag
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(plugin);
}

export default plugin;
const version = '__VERSION__';
// Export all components too
export {
    FileInput,
    version
};
