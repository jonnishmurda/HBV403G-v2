document.addEventListener('DOMContentLoaded', () => {

    /**
     * 
     * @param {*} e 'button'
     * @param {*} isCorrect Athugar hvort fall fái boolean gildi true/false
     * 
     * Ef true: breytir litnum í grænan og afvirkjar alla 'buttons' í spurningunni
     * Ef false: breytir litnum í rauðan og afvirkjar alla 'buttons' í spurningunni
     */
    function checkCorrect(e, isCorrect) {
        const parent = e.target.closest('ul');
        const buttons = parent.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);

        if (isCorrect) {
            e.target.style.backgroundColor = 'green';
            e.target.style.color = 'white';
            e.target.style.boxShadow = '#000 5px 5px';
        } else {
            e.target.style.backgroundColor = 'red';
            e.target.style.color = 'white';
            e.target.style.boxShadow = '#000 5px 5px';
        }
    }

    document.querySelectorAll('.answer').forEach(button => {
        button.addEventListener('click', function (event) {
            checkCorrect(event, this.getAttribute('data-correct') === 'true');
        });
    });
});
