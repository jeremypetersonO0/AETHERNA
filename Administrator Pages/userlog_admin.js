const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const table = document.getElementById("userTable").getElementsByTagName("tbody")[0];

searchInput.addEventListener("keyup", filterTable);
filterType.addEventListener("change", filterTable);

function filterTable() {
    const search = searchInput.value.toLowerCase();
    const filter = filterType.value;

    const rows = table.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        let name = rows[i].cells[0].textContent.toLowerCase();
        let status = rows[i].cells[7].textContent;

        let matchSearch = name.includes(search);
        let matchFilter = filter === "" || status === filter;

        rows[i].style.display = (matchSearch && matchFilter) ? "" : "none";
    }
}