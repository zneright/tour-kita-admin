document.addEventListener("DOMContentLoaded", function () {
    const faders = document.querySelectorAll(".fade-in-section");

    const options = {
        threshold: 0.1, // trigger when 10% of element is visible
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // fade in only once
        });
    }, options);

    faders.forEach((fader) => {
        appearOnScroll.observe(fader);
    });
});
