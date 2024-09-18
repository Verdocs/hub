import {ITemplateField} from '../../Models';
import {sortFields} from '../../Utils';

const TestFieldBase: ITemplateField = {
  page: 0,
  x: 0,
  y: 0,
  name: 'test',
  role_name: 'test',
  template_id: 'test',
  document_id: 'test',
  type: 'signature',
  required: false,
  settings: null,
  validator: null,
  label: null,
  width: 0,
  height: 0,
  default: null,
  placeholder: null,
  multiline: false,
  group: null,
  options: null,
};

it('sortFields should work as expected', async () => {
  const testFields: ITemplateField[] = [
    {...TestFieldBase, name: 'sort5', page: 1, x: 200, y: 300, height: 15},
    {...TestFieldBase, name: 'sort3', page: 0, x: 200, y: 700, height: 15},
    {...TestFieldBase, name: 'sort7', page: 1, x: 10, y: 100, height: 15},
    {...TestFieldBase, name: 'sort8', page: 1, x: 10, y: 100, height: 30},
    {...TestFieldBase, name: 'sort4', page: 0, x: 20, y: 600, height: 15},
    {...TestFieldBase, name: 'sort1', page: 0, x: 20, y: 700, height: 15},
    {...TestFieldBase, name: 'sort6', page: 1, x: 20, y: 500, height: 15},
    {...TestFieldBase, name: 'sort2', page: 0, x: 100, y: 702, height: 15},
  ];

  sortFields(testFields);

  expect(testFields[0].name).toBe('sort1');
  expect(testFields[1].name).toBe('sort2');
  expect(testFields[2].name).toBe('sort3');
  expect(testFields[3].name).toBe('sort4');
  expect(testFields[4].name).toBe('sort6');
  expect(testFields[5].name).toBe('sort5');
  expect(testFields[6].name).toBe('sort8');
  expect(testFields[7].name).toBe('sort7');
});
