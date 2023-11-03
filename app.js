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
        pianoRollContainer.setAttribute('style', 'grid-template-columns: 60% 40%; overflow: hidden;');

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

        // Create Interactive Selection Tool
        let isDragging = false;
        let startX, startY;
        const svgNS = 'http://www.w3.org/2000/svg'; // SVG namespace
        const svgElement = mainPianoRollDiv.querySelector('svg');
        const svgPoint = svgElement.createSVGPoint();

        // Function to create a new rectangle element
        function createRect(x, y, width, height) {
          const rect = document.createElementNS(svgNS, 'rect');
          rect.setAttributeNS(null, 'x', x);
          rect.setAttributeNS(null, 'y', y);
          rect.setAttributeNS(null, 'width', width);
          rect.setAttributeNS(null, 'height', height);
          rect.setAttributeNS(null, 'class', 'selected-area');
          return rect;
        }

        function getSVGCoordinates(event) {
          // Get the bounding rectangle of the SVG element.
          const rect = svgElement.getBoundingClientRect();
        
          // Adjust the point for the position of the SVG element.
          svgPoint.x = event.clientX - rect.left;
          svgPoint.y = event.clientY - rect.top;
        
          // Adjust for the non-uniform scaling if preserveAspectRatio is 'none'.
          // This is necessary because the SVG content is scaled to fit its container element,
          // and we need to map the mouse coordinates from the container's coordinate system
          // back into the original SVG coordinate system as defined by the viewBox.
          svgPoint.x *= (svgElement.viewBox.baseVal.width / rect.width);
          svgPoint.y *= (svgElement.viewBox.baseVal.height / rect.height);
        
          return svgPoint;
        }

        // Mouse down event
        svgElement.addEventListener('mousedown', function (event) {

          const selectedArea = document.getElementsByClassName('selected-area')[0];
          if (selectedArea !== undefined) selectedArea.remove();

          isDragging = true;
          const coords = getSVGCoordinates(event);
          startX = coords.x;
          startY = 0;

          const rect = createRect(startX, startY, 0, 1);
          
          // Insert the new rectangle as the first child of the SVG element
          const firstChild = svgElement.firstChild;
          svgElement.insertBefore(rect, firstChild);
        });

        // Mouse move event
        svgElement.addEventListener('mousemove', function (event) {
          if (isDragging) {
            const rect = svgElement.querySelector('rect.selected-area');
            const coords = getSVGCoordinates(event);
            const currentX = coords.x;
            const currentY = coords.y;
            const width = Math.abs(currentX - startX);
            // Because of viewBox our grid system from 0 to 1
            const height = 1;
            const newX = (currentX < startX) ? currentX : startX;
            const newY = (currentY < startY) ? currentY : startY;

            rect.setAttributeNS(null, 'x', newX);
            rect.setAttributeNS(null, 'y', newY);
            rect.setAttributeNS(null, 'width', width);
            rect.setAttributeNS(null, 'height', height);
          }
        });

        // Mouse up event
        svgElement.addEventListener('mouseup', function () {
          isDragging = false;

          // Handle the end of the dragging event
          const selectedArea = document.getElementsByClassName('selected-area')[0];
          const selectedAreaX1 = selectedArea.getAttribute('x');
          const selectedAreaX2 = +selectedArea.getAttribute('width') + +selectedAreaX1;
          const allNotes = document.getElementsByClassName('main-div')[0].getElementsByClassName('note-rectangle');
          let numberOfNotes = 0;
          Array.prototype.forEach.call(allNotes, function(note) {
            const noteX1 = note.getAttribute('x');
            if (noteX1 >= selectedAreaX1 && noteX1 <= selectedAreaX2) numberOfNotes++;
          });
          alert('Number of notes: ' + numberOfNotes);
        });

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
