import PianoRoll from './pianoroll.js';

class PianoRollDisplay {
  constructor(csvURL) {
    this.csvURL = csvURL;
    this.data = null;
  }

  async loadPianoRollData() {
    try {
      const response = await fetch('https://pianoroll.ai/random_notes');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  selectedPianoRollID = -1;

  preparePianoRollCard(rollId) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('piano-roll-card');

    // Create and append other elements to the card container as needed
    const descriptionDiv = document.createElement('div');
    descriptionDiv.classList.add('description');
    descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
    cardDiv.appendChild(descriptionDiv);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('piano-roll-svg');
    svg.setAttribute('width', '80%');
    svg.setAttribute('height', '150');
    
    // Make each Piano Roll in the grid clickable
    cardDiv.addEventListener('click', () => {
        // If we clicked on the same active tile -> no action
        if (this.selectedPianoRollID === rollId) {
          return
        }
    
        this.selectedPianoRollID = rollId;

        const pianoRollContainer = document.getElementById('pianoRollContainer');
        pianoRollContainer.innerHTML = '';

        // Create blocks for main and rest Piano Rolls
        const mainPianoRollDiv = document.createElement('div');
        const restOfPianoRollsDiv = document.createElement('div');

        // Make main Piano Roll block bigger
        pianoRollContainer.setAttribute('style', 'grid-template-columns: 60% 40%');

        // Add classes to divs of main and rest Piano Rolls blocks
        mainPianoRollDiv.classList.add('main-div');
        restOfPianoRollsDiv.classList.add('side-div');

        for (let it = 0; it < 20; it++) {
          const start = it * 60;
          const end = start + 60;
          const partData = this.data.slice(start, end);
    
          const { cardDiv, svg } = this.preparePianoRollCard(it)

          // Add to the main Piano Roll block only the selected element
          if (it !== rollId) {
            restOfPianoRollsDiv.appendChild(cardDiv);
          } else {
            mainPianoRollDiv.appendChild(cardDiv);
            // Increase hight of main Piano Roll
            cardDiv.querySelector('svg').setAttribute('height', '300');
          }
          
          const roll = new PianoRoll(svg, partData);
        }

        pianoRollContainer.appendChild(mainPianoRollDiv);
        pianoRollContainer.appendChild(restOfPianoRollsDiv);
      }
    )

    // Append the SVG to the card container
    cardDiv.appendChild(svg);

    return { cardDiv, svg }
  }

  async generateSVGs() {
    if (!this.data) await this.loadPianoRollData();
    if (!this.data) return;
    
    const pianoRollContainer = document.getElementById('pianoRollContainer');
    pianoRollContainer.innerHTML = '';

    // Display the Piano Rolls in a responsive grid layout on the main page
    pianoRollContainer.setAttribute('style', 'grid-template-columns: auto auto auto');

    for (let it = 0; it < 20; it++) {
      const start = it * 60;
      const end = start + 60;
      const partData = this.data.slice(start, end);

      const { cardDiv, svg } = this.preparePianoRollCard(it)

      pianoRollContainer.appendChild(cardDiv);
      const roll = new PianoRoll(svg, partData);
    }
  }
}

document.getElementById('loadCSV').addEventListener('click', async () => {
  const csvToSVG = new PianoRollDisplay();
  await csvToSVG.generateSVGs();
});
