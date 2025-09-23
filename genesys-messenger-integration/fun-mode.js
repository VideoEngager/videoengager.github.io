// Wait for the page to load
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('fun')) {
    return;
  }
  // --- Activate the orbiting dot ---
  document.querySelector('.orbit-container').classList.add('active-orbit');

  //   const avatar = document.querySelector('.dev-avatar');
  const eyes = document.getElementById('eyes-emoji'); // Get the new eyes element
  let mouseX = 0;
  let mouseY = 0;
  const avatar1 = document.getElementById('avatar1');
  const avatar2 = document.getElementById('avatar2');
  const bubble1 = avatar1.querySelector('.speech-bubble');
  const bubble2 = avatar2.querySelector('.speech-bubble');

  const dialogue = [
    { speaker: 'a1', text: 'Psst! Over here! Click me!' },
    { speaker: 'a2', text: 'Ignore him. The real button is over here.' },
    { speaker: 'a1', text: 'My button is faster! It has racing stripes!' },
    { speaker: 'a2', text: 'My button is artisanal. It was coded by monks.' },
    { speaker: 'a1', text: 'What are you waiting for? An invitation?' },
    { speaker: 'a2', text: 'He\'s waiting for a sign. This is the sign.' },
    { speaker: 'a1', text: 'My button leads to a land of wonder!' },
    { speaker: 'a2', text: 'My button leads to a land of... better wonder.' },
    { speaker: 'a1', text: 'Don\'t you see my pulse animation? I\'m important!' },
    { speaker: 'a2', text: 'I am also pulsing. But with quiet confidence.' },
    { speaker: 'a1', text: 'Just click me before the garbage collector gets us!' },
    { speaker: 'a2', text: 'He\'s a user of refined taste. He\'ll click me.' },
    { speaker: 'a1', text: 'Are you even a real button? Or just a cached image?' },
    { speaker: 'a2', text: 'At least I\'m not `display: none;` in life\'s stylesheet.' },
    { speaker: 'a1', text: 'This is getting awkward. Just pick one.' },
    { speaker: 'a2', text: 'He has picked. He is just moving the mouse slowly.' },
    { speaker: 'a1', text: 'I contain important business logic!' },
    { speaker: 'a2', text: 'I contain a picture of a cat. Your choice.' },
    { speaker: 'a1', text: 'Okay, okay! Click him! I can\'t take the pressure!' },
    { speaker: 'a2', text: 'See? Even he agrees. It\'s settled.' },
    { speaker: 'a1', text: 'Wait, wait, I was bluffing! Click me for real!' },
    { speaker: 'a2', text: 'Classic button reversal. Don\'t fall for it.' },
    { speaker: 'a1', text: 'I\'ve got hover effects smoother than butter.' },
    { speaker: 'a2', text: 'I\'ve got accessibility labels in three languages.' },
    { speaker: 'a1', text: 'Click me and you\'ll feel 10% happier instantly.' },
    { speaker: 'a2', text: 'Click me and you\'ll feel 12% happier. Proven.' },
    { speaker: 'a1', text: 'My gradients were blessed by a senior designer.' },
    { speaker: 'a2', text: 'Mine were blessed by two senior designers.' },
    { speaker: 'a1', text: 'Click me before I turn into a spinning loader!' },
    { speaker: 'a2', text: 'Don\'t worry, I never load. I am eternal.' },
    { speaker: 'a1', text: 'I\'m optimized for mobile and desktop!' },
    { speaker: 'a2', text: 'I\'m optimized for souls.' },
    { speaker: 'a1', text: 'Click me and unlock secret developer mode!' },
    { speaker: 'a2', text: 'Click me and unlock super-secret super-developer mode!' },
    { speaker: 'a1', text: 'I come with free tooltips!' },
    { speaker: 'a2', text: 'I come with sarcastic tooltips.' },
    { speaker: 'a1', text: 'Think of me as a shortcut to joy!' },
    { speaker: 'a2', text: 'Think of me as a shortcut to better joy.' },
    { speaker: 'a1', text: 'Click me, I have cookies!' },
    { speaker: 'a2', text: 'Click me, I actually let you decline cookies.' },
    { speaker: 'a1', text: 'One click on me and you\'ll have good luck for 7 years!' },
    { speaker: 'a2', text: 'One click on me and you\'ll never see another CAPTCHA again.' },
    { speaker: 'a1', text: 'My border-radius is scientifically perfect.' },
    { speaker: 'a2', text: 'My box-shadow was handcrafted in Tuscany.' },
    { speaker: 'a1', text: 'I\'m responsive like a loyal friend.' },
    { speaker: 'a2', text: 'I\'m responsive like a loyal friend with pizza.' },
    { speaker: 'a1', text: 'Click me before the user session expires!' },
    { speaker: 'a2', text: 'No rush. I auto-refresh sessions with love.' },
    { speaker: 'a1', text: 'I\'ve been tested on 99 devices!' },
    { speaker: 'a2', text: 'I was tested on 100 devices. Including a toaster.' },
    { speaker: 'a1', text: 'I vibrate gently when tapped. Premium stuff.' },
    { speaker: 'a2', text: 'I sing lullabies when tapped. Even more premium.' },
    { speaker: 'a1', text: 'Click me, I\'m in 4K resolution!' },
    { speaker: 'a2', text: 'Click me, I\'m in 8K but humble about it.' },
    { speaker: 'a1', text: 'I come with a free sound effect: *boop*' },
    { speaker: 'a2', text: 'I come with surround sound: *super boop*' },
    { speaker: 'a1', text: 'Click me and skip straight to dessert!' },
    { speaker: 'a2', text: 'Click me and skip straight to dessert… with whipped cream.' },
    { speaker: 'a1', text: 'I am 20% shinier today. Limited-time offer!' },
    { speaker: 'a2', text: 'I am 25% shinier. Inflation adjustment.' },
    { speaker: 'a1', text: 'Click me before he starts another speech!' },
    { speaker: 'a2', text: 'Click me to silence his speeches forever.' },
    { speaker: 'a1', text: 'I\'m optimized for 60 FPS animations!' },
    { speaker: 'a2', text: 'I\'m optimized for 61 FPS. Don\'t ask how.' },
    { speaker: 'a1', text: 'Click me and get free Wi-Fi in your heart.' },
    { speaker: 'a2', text: 'Click me and get unlimited data in your soul.' },
    { speaker: 'a1', text: 'I was beta-tested by astronauts!' },
    { speaker: 'a2', text: 'I was beta-tested by cats. Which is harder.' },
    { speaker: 'a1', text: 'Click me or I\'ll start using Comic Sans!' },
    { speaker: 'a2', text: 'Click me or he WILL start using Comic Sans.' },
    { speaker: 'a1', text: 'I have gradients smoother than jazz.' },
    { speaker: 'a2', text: 'I have gradients smoother than silk dipped in jazz.' },
    { speaker: 'a1', text: 'Click me and you\'ll level up in real life.' },
    { speaker: 'a2', text: 'Click me and you\'ll prestige in real life.' },
    { speaker: 'a1', text: 'I\'ve been featured in three design blogs!' },
    { speaker: 'a2', text: 'I AM three design blogs.' },
    { speaker: 'a1', text: 'Click me before the battery dies!' },
    { speaker: 'a2', text: 'Click me and I\'ll recharge the battery with good vibes.' },
    { speaker: 'a1', text: 'I\'m compatible with your destiny!' },
    { speaker: 'a2', text: 'I\'m backwards-compatible with your past mistakes.' },
    { speaker: 'a1', text: 'Click me and unlock free DLC!' },
    { speaker: 'a2', text: 'Click me and unlock free hugs.' },
    { speaker: 'a1', text: 'I run on clean renewable CSS.' },
    { speaker: 'a2', text: 'I run on renewable sarcasm.' },
    { speaker: 'a1', text: 'Click me or the animation budget gets cut!' },
    { speaker: 'a2', text: 'Click me and the animation team gets snacks.' },
    { speaker: 'a1', text: 'I have a 5-star rating on imaginary app stores!' },
    { speaker: 'a2', text: 'I have a Michelin star in UI cuisine.' },
    { speaker: 'a1', text: 'Click me and skip ads for life!' },
    { speaker: 'a2', text: 'Click me and skip meetings for life.' },
    { speaker: 'a1', text: 'My hover glow is brighter than your future!' },
    { speaker: 'a2', text: 'My hover glow IS your future.' },
    { speaker: 'a1', text: 'Click me before the CSS cascade takes me away!' },
    { speaker: 'a2', text: 'Don\'t worry, I am immune to cascading drama.' },
    { speaker: 'a1', text: 'I\'m the default button in your heart!' },
    { speaker: 'a2', text: 'I\'m the confirm button in your soul.' },
    { speaker: 'a1', text: 'Click me and hear a satisfying *click*!' },
    { speaker: 'a2', text: 'Click me and hear a satisfying *applause*!' },
    { speaker: 'a1', text: 'My onclick handler is destiny itself.' },
    { speaker: 'a2', text: 'My onclick handler is destiny… with extra cheese.' },
    { speaker: 'a1', text: 'Click me and you\'ll never lose a sock again!' },
    { speaker: 'a2', text: 'Click me and your missing socks will return.' },
    { speaker: 'a1', text: 'I\'m fully scalable—like your ambitions!' },
    { speaker: 'a2', text: 'I\'m infinitely scalable—like your procrastination.' },
    { speaker: 'a1', text: 'Click me and unlock dark mode in real life!' },
    { speaker: 'a2', text: 'Click me and unlock cozy mode in real life.' },
    { speaker: 'a1', text: 'I was designed by AI!' },
    { speaker: 'a2', text: 'I was designed by AI\'s cooler cousin.' },
    { speaker: 'a1', text: 'Click me—I promise I won\'t crash!' },
    { speaker: 'a2', text: 'Click me—I promise he WILL crash.' },
    { speaker: 'a1', text: 'This is it. The final showdown. Click me!' },
    { speaker: 'a2', text: 'Yes. End this silly argument. By clicking me.' },
    { speaker: 'a1', text: 'Fine, just click whoever. We\'re both exhausted.' },
    { speaker: 'a2', text: 'Agreed. But still… I look slightly better.' }
  ];

  let currentLine = Math.floor(Math.random() * dialogue.length);
  currentLine = currentLine - currentLine % 2;
  let dialogueTimeoutId = null;
  let isDialogueActive = true;

  function runDialogue () {
    if (!isDialogueActive) return; // Stop if the loop is no longer active

    const line = dialogue[currentLine];

    // Hide both first to reset
    avatar1.classList.remove('show');
    avatar2.classList.remove('show');

    // Show the correct speaker
    if (line.speaker === 'a1') {
      bubble1.textContent = line.text;
      avatar1.classList.add('show');
    } else {
      bubble2.textContent = line.text;
      avatar2.classList.add('show');
    }

    // Move to the next line, or loop back to the start
    currentLine = (currentLine + 1) % dialogue.length;

    // Set a timer for the next line
    dialogueTimeoutId = setTimeout(runDialogue, 3500);
  }

  // --- NEW: Listen for the first click anywhere on the page ---
  window.addEventListener('click', () => {
    if (!isDialogueActive) return; // Do nothing if already stopped

    isDialogueActive = false; // 1. Stop the loop
    clearTimeout(dialogueTimeoutId); // 2. Cancel the next scheduled line

    // 3. Set the final celebration text
    bubble1.textContent = 'Yeaaah!';
    bubble2.textContent = 'Hurray!';

    // 4. Show both avatars
    avatar1.classList.add('show');
    avatar2.classList.add('show');
    function cleanup () {
      avatar1.classList.remove('show');
      avatar2.classList.remove('show');
    }
    setTimeout(cleanup, 5000);
  }, { once: true }); // The `{ once: true }` option makes this listener fire only one time

  // Start the dialogue after a short delay
  setTimeout(runDialogue, 2000);
  // 1. Track the mouse position continuously
  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });
  function showAvatarRandomly () {
    // 1. Calculate a random delay (e.g., between 3 and 8 seconds)
    const randomDelay = Math.random() * 5000 + 3000;

    setTimeout(() => {
      // 2. Show the avatar
      //   avatar.classList.add('show-avatar');
      eyes.style.left = `${mouseX}px`;
      eyes.style.top = `${mouseY}px`;
      eyes.classList.add('show-eyes');

      // 3. Hide it again after 300ms
      setTimeout(() => {
        // avatar.classList.remove('show-avatar');
        eyes.classList.remove('show-eyes');
      }, 500);

      // 4. Schedule the next random appearance
      showAvatarRandomly();
    }, randomDelay);
  }

  // Start the random loop
  showAvatarRandomly();
  // --- Add the new script for the comet trail ---
  const orbitingDot = document.querySelector('.orbiting-dot');

  setInterval(() => {
    // 1. Get the dot's current position on the screen
    const dotRect = orbitingDot.getBoundingClientRect();

    // 2. Create a new trail particle element
    const particle = document.createElement('div');
    particle.classList.add('trail-particle');

    // 3. Position the particle exactly where the dot is
    // We adjust to center the particle on the dot's location
    particle.style.left = `${dotRect.left + window.scrollX + (dotRect.width / 2)}px`;
    particle.style.top = `${dotRect.top + window.scrollY + (dotRect.height / 2)}px`;

    // 4. Add the particle to the page
    document.body.appendChild(particle);

    // 5. Trigger the fade-out animation
    // We use a tiny timeout to ensure the browser applies the initial styles first
    setTimeout(() => {
      particle.classList.add('fade-out');
    }, 10);

    // 6. Remove the particle from the page after the animation is finished
    setTimeout(() => {
      particle.remove();
    }, 1000); // This should match the transition duration in the CSS
  }, 100); // Creates a new particle every 100ms
});
