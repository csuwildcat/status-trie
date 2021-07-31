
let testEntries = [
  { key: '4c80cc05da728dd30c59bec09a919b11b7ce8de10a5bb571f82c3bd3abfa49e3', value: 0 },
  { key: 'd46e7532c5d699ad6619c41bf76cbe571cab54b343842aa9e89464319289016d', value: 2 },
  { key: '9bccfd46dd5be0b3dc92790231a162b9634efc36da7579583010c9cd061b692c', value: 1 },
  { key: '0b4c13cea8b85180577bf52fe55adb9042c836b1e63eca1e6f2eee9b63e506fd', value: 1 },
  { key: '19ac6ec856d9e715c498693d0509ef33d39435795b7cce74f9182b9012d66df3', value: 0 },
  { key: '245280404ce6a938cc3f853574b52c4c71b8c730e4872eaa5c0ad980384846f4', value: 0 },
  { key: '37b9be89f8b7b7675d15a8521455f3691cd22a6968cf9b8b35293456b5dc999d', value: 0 },
  { key: 'f79eb2d55c0779d95576cd28b8222c2c8ac4c6a8473bfa26fcf0556e7a4e2123', value: 2 },
  { key: 'e714d38b4571f4aca69f83d909d6f2f3a8016b5b0a343295724bc6925ddcc66f', value: 0 },
  { key: '66bf03e6b4ab190a4ccae05b490d428f27169c3a23492d2a5b159d50650ad463', value: 0 },
  { key: '027e9c8c581079843a5c2e9b7fa3056dffcfdb392b68979c3294f8fda2b944cb', value: 1 },
  { key: '7eda419a11ff7d0571582c217465a1e70d9b444bde2f97abd99ef37ec89f3cb7', value: 0 },
  { key: '114cd4f5b24999225b444944778dc08306e3f28e485457669dcfc532e0ee03da', value: 1 },
  { key: 'e09e09399a6e426def72adfc4926e064276f52bc30a9e3c84a1ace2e89e5d11e', value: 0 },
  { key: '42565995914fd037b9316763e9375e993bdb1da5c8a09ec28ebddc0c7d209eb1', value: 0 },
  { key: '15a89a06690474d46c268529845b334101c733ae2adbd76147bbafa2608b4979', value: 1 },
  { key: 'e1f44457ef3ca03d69cd1f8eedf45b0e4fd76fec124fc41215fb5b6588e645e1', value: 0 },
  { key: '343fe6f09c1bb4d5be1d2b54215d8a17f34f2e6921e47277ba41212f16cbbd51', value: 2 },
  { key: '27c4738cb446e92ae704fc723ef00c77353f9bf2efb28803bb6c794a4464b07b', value: 0 },
]

function assembleTrie(entries){
  let trie = {};
  let iteration = 0;
  while (entries.length) {
    entries = entries.filter(entry => {
      let branch = entry.branch || trie;
      if (branch.close) {
        entry.ancestor[branch.close] = entry.value;
      }
      let char = entry.key[iteration];
      if (char) {
        entry.ancestor = branch;
        branch[char] ? delete branch[char].close : branch[char] = { close: char };
        entry.branch = branch[char];
        return true;
      }
    });
    ++iteration;
  }
  return trie;
}

console.log(JSON.stringify(assembleTrie(testEntries), null, 2));