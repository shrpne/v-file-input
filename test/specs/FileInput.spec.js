import FileInput from 'src/FileInput.vue';
import { createVM } from '../helpers/utils.js';

describe('FileInput.vue', function () {
    it('should render correct contents', function () {
        const vm = createVM(this, `<FileInput/>`, { components: { FileInput }});
        const input = vm.$el.querySelector('.file-input');
        input.nodeName.toUpperCase().should.eql('INPUT');
        input.getAttribute('type').toLowerCase().should.eql('file');
    });
});
