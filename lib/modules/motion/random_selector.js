class RandomSelector {
  constructor(elements, chance) {
    this.elements = elements;
    this.chance = chance;
  }

  select(cb) {
    if (Math.random() >= this.chance) {
      return;
    }

    const { length } = this.elements;
    const index = Math.floor(Math.random() * length);

    cb(this.elements[index]);
  }
}

module.exports = RandomSelector;
