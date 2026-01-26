import {sortFields, sortDocuments, sortRecipients} from '../../Envelopes';

const TestUnorderedDocuments = [
  // Should be second: order 1, but created later
  {id: 'B', order: 1, created_at: '2026-01-22T14:39:31.727Z'},
  // Should be third: order 2
  {id: 'C', order: 2, created_at: '2026-01-22T14:39:31.727Z'},
  // Should be first: order 1, created earlier
  {id: 'A', order: 1, created_at: '2026-01-22T11:39:31.727Z'},
];

const TestUnorderedRecipients = [
  {id: 'B', sequence: 1, order: 2},
  {id: 'C', sequence: 2, order: 1},
  {id: 'A', sequence: 1, order: 1},
];

const TestFieldBase = {page: 0, x: 0, y: 0, name: 'test', width: 0, height: 0};
const TestUnorderedFields = [
  {...TestFieldBase, name: 'sort5', page: 1, x: 200, y: 300, height: 15},
  {...TestFieldBase, name: 'sort3', page: 0, x: 200, y: 700, height: 15},
  {...TestFieldBase, name: 'sort7', page: 1, x: 10, y: 100, height: 15},
  {...TestFieldBase, name: 'sort8', page: 1, x: 10, y: 100, height: 30},
  {...TestFieldBase, name: 'sort4', page: 0, x: 20, y: 600, height: 15},
  {...TestFieldBase, name: 'sort1', page: 0, x: 20, y: 700, height: 15},
  {...TestFieldBase, name: 'sort6', page: 1, x: 20, y: 500, height: 15},
  {...TestFieldBase, name: 'sort2', page: 0, x: 100, y: 702, height: 15},
];

describe('Envelopes sorting utilities', () => {
  it('sortFields should work as expected', async () => {
    const testFields = [...TestUnorderedFields];
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

  it('sortDocuments should work as expected', async () => {
    const testDocuments = [...TestUnorderedDocuments];
    sortDocuments(testDocuments);

    expect(testDocuments[0].id).toBe('A');
    expect(testDocuments[1].id).toBe('B');
    expect(testDocuments[2].id).toBe('C');
  });

  it('sortRecipients should work as expected', async () => {
    const testRecipients = [...TestUnorderedRecipients];
    sortRecipients(testRecipients);

    expect(testRecipients[0].id).toBe('A');
    expect(testRecipients[1].id).toBe('B');
    expect(testRecipients[2].id).toBe('C');
  });
});
