const axios = require("axios");
const API_KEY =
  "dict.1.1.20210216T114936Z.e4989dccd61b9626.373cddfbfb8a3b2ff30a03392b4e0b076f14cff9";

async function fetchDoc(responses) {
  // fetch the document
  axios.get("http://norvig.com/big.txt").then((response) => {
    // retrieve all the words
    let words = response.data.split(/[^a-zA-Z0-9]+/g);

    // dictionary of word and occurrences count of word
    let wordCountMap = words.reduce(function (stats, word) {
      if (stats.hasOwnProperty(word)) {
        stats[word] = stats[word] + 1;
      } else {
        stats[word] = 1;
      }
      return stats;
    }, {});

    const sortable = [];
    for (let word in wordCountMap) {
      sortable.push([word, wordCountMap[word]]);
    }

    // sort the array on descending order of count and get the first ten records
    const tenRecords = sortable.sort((a, b) => b[1] - a[1]).slice(0, 10);

    // fetch the details of each word
    axios
      .all(
        tenRecords.map((element) =>
          axios.get(
            `https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=${API_KEY}&lang=en-en&text=${element[0]}`
          )
        )
      )
      .then((responseArr) => {
        const resultArr = [];
        //iterate over the response of each word
        for (let i = 0; i < responseArr.length; i++) {
          // scenario where def is empty for a word for ex: 'was'
          if (responseArr[i].data.def.length === 0) {
            resultArr.push({
              text: tenRecords[i][0],
              count: tenRecords[i][1],
              pos: "",
              syn: [],
            });
          } else {
            responseArr[i].data.def.map((val) => {
              const syns = [];
              // fetch all the synonyms for a word
              val.tr.forEach((tr) => {
                if (tr.syn !== undefined && tr.syn.length > 0) {
                  syns.push(tr.syn.map((syn) => syn.text));
                }
              });
              return resultArr.push({
                text: val.text,
                count: tenRecords[i][1],
                pos: val.pos,
                syn: syns.flat(),
              });
            });
          }
        }
        // log all the word list in a required format
        console.log(resultArr);
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

(async () => {
  await fetchDoc();
})();
