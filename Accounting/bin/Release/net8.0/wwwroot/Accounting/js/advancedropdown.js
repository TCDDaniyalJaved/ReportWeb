
document.addEventListener("DOMContentLoaded", function () {
    const toggleIcon = document.getElementById("searchFilterToggle");
    const dropdown = document.getElementById("advancedDropdown");
    if (!toggleIcon || !dropdown) return;

    toggleIcon.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.classList.toggle("d-none");
    });

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".input-group")) {
            dropdown.classList.add("d-none");
        }
    });

    // Handle Group By clicks (placeholder - implement in OpeningMasterDummy.js)
    document.querySelectorAll("[data-group]").forEach(item => {
        item.addEventListener("click", function () {
            const groupBy = this.dataset.group;
            //  call function to apply grouping / reload table
        });
    });

    // Handle Filter clicks (placeholder)
    document.querySelectorAll("[data-filter]").forEach(item => {
        item.addEventListener("click", function () {
            const filter = this.dataset.filter;
            //  show filter modal / apply filter badge
        });
    });
});