function choose(arr) {
  const choice = Math.trunc(Math.random() * arr.length);
  return arr[choice];
}

exports.choose = choose;
