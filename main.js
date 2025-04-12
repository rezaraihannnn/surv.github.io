function generateInsight(data) {
    if (!data.length) {
      return `<p class="text-danger">Tidak ada data untuk dianalisis.</p>`;
    }
  
    const totalTiket = data.length;
    const overTTR = data.filter(d => parseFloat(d["SISA TTR (JAM)"]) < 0).length;
    const witelCount = {};
  
    data.forEach(d => {
      const witel = d["WITEL"];
      if (witel) witelCount[witel] = (witelCount[witel] || 0) + 1;
    });
  
    const topWitel = Object.entries(witelCount).sort((a, b) => b[1] - a[1])[0];
  
    return `
      <ul class="list-group list-group-flush">
        <li class="list-group-item">📌 Total Tiket Aktif: <strong>${totalTiket}</strong></li>
        <li class="list-group-item text-danger">⏰ Tiket Lewat TTR: <strong>${overTTR}</strong></li>
        <li class="list-group-item">🏢 WITEL Terbanyak: <strong>${topWitel ? topWitel[0] + " (" + topWitel[1] + ")" : '-'}</strong></li>
      </ul>
    `;
  }

  function formatReportedDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
  
    const options = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
  
    return date.toLocaleString('id-ID', options).replace(',', '');
  }
// Nonaktifkan Ctrl+U dan klik kanan
    document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
      e.preventDefault();
    }
  
    // Nonaktifkan Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
    }
  
    // Nonaktifkan F12
    if (e.key === "F12") {
      e.preventDefault();
    }
  });
  
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  
  $(document).ready(function () {
    const map = L.map('map').setView([-6.9147, 107.6098], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const blinkingIcon = L.divIcon({ className: 'blinking-marker' });
    const markersGroup = L.layerGroup().addTo(map);
    const witelCoords = {
      "BANDUNG": [-6.9147, 107.6098],
      "BANDUNGBRT": [-6.8781, 107.5793],
      "TASIKMALAYA": [-7.3274, 108.2208],
      "KARAWANG": [-6.3059, 107.3546],
      "SUKABUMI": [-6.9214, 106.9269],
      "CIREBON": [-6.7320, 108.5523]
    };

    const table = $('#dataTable').DataTable({
      ajax: {
          url: 'https://script.google.com/macros/s/AKfycby-6GIfyW9XCxefZa1V91gB5P8XPx7OOdWtI8jU25QmHrYS7pUAdAyCLRSFiRMuKsoeIg/exec',
          dataSrc: function(json) {
            // Filter: hanya tampilkan jika kolom NO tidak kosong
            try {
                const filtered = json.filter(row => row["NO"] && row["NO"].toString().trim() !== "");
                $("#insightContainer").html(generateInsight(filtered));
                
                markersGroup.clearLayers();
                filtered.forEach(d => {
                  const witel = d["WITEL"]?.toUpperCase().replace(/\s+/g, "");
                  if (witelCoords[witel]) {
                    const [lat, lng] = witelCoords[witel];
                    L.marker([lat, lng], { icon: blinkingIcon })
                      .addTo(markersGroup)
                      .bindPopup(`Tiket di ${d["WITEL"]}`);
                  }
        
                  // Tambahkan flag untuk highlight kuning jika SISA TTR < 24 jam
                  const jam = parseFloat(d["SISA TTR (JAM)"]);
                  d._highlight = !isNaN(jam) && jam < 0;
                });
                
                return filtered;
              } catch (err) {
                console.error("Error saat generate insight:", err);
                $("#insightContainer").html(`<p class="text-danger">Gagal menganalisis data.</p>`);
                return [];
              }
          }
      },
      columns: [
        { data: "NO" },
        { data: "WITEL" },
        { data: "STO" },
        { data: "No Tiket" },
        { data: "Summary" },
        { data: "REPORTED DATE", 
          render: function (data) {
            return formatReportedDate(data);
          }
        },
        { data: "SEGMEN" },
        { data: "TARGET TTR  (JAM)" },
        { data: "LAMA OPEN (JAM)" },
        { data: "SISA TTR (JAM)" },
        { data: "JML ANAK TERELASI STATUS       < OPEN >" },
        { data: "JML ANAK TERELASI  STATUS             < CLOSE >" },
        { data: "JUMLAH TIKET RELASI" }
      ],
      createdRow: function(row, data, dataIndex) {
        if (data._highlight) {
          const cellIndex = 9; // Sesuaikan index kolom "SISA TTR (JAM)"
          $("td", row).eq(cellIndex).css({
            "background-color": "#fff3cd",
            "color": "#856404"
          });
        }
      },
      pageLength: 5,
      ordering: false,
      deferRender: true,
      dom: "<'d-flex justify-content-between align-items-center mb-2'<'dt-buttons'B><'dataTables_filter'f>>" +
      "<'table-responsive't>" +
      "<'d-flex justify-content-between align-items-center mt-2'lip>",   
      language: {
        emptyTable: "Sedang tidak ada kejadian Gamas"
      },
      buttons: [
        {
          extend: 'copyHtml5',
          text: '<i class="bi bi-clipboard"></i>',
          titleAttr: 'Copy',
          className: 'btn btn-sm'
        },
        {
          extend: 'csvHtml5',
          text: '<i class="bi bi-file-earmark-spreadsheet"></i>',
          titleAttr: 'Export CSV',
          className: 'btn btn-sm'
        },
        {
          extend: 'excelHtml5',
          text: '<i class="bi bi-file-earmark-excel"></i>',
          titleAttr: 'Export Excel',
          className: 'btn btn-sm'
        },
        {
          extend: 'pdfHtml5',
          text: '<i class="bi bi-file-earmark-pdf"></i>',
          titleAttr: 'Export PDF',
          className: 'btn btn-sm'
        },
        {
          extend: 'print',
          text: '<i class="bi bi-printer"></i>',
          titleAttr: 'Print',
          className: 'btn btn-sm'
        }
      ],
      rowCallback: function (row, data) {
        const sisa = parseFloat(data["SISA TTR (JAM)"]);
        if (!isNaN(sisa) && sisa < 0) $('td:eq(9)', row).addClass("highlight-yellow");

        const witel = data["WITEL"]?.toUpperCase().replace(/\s+/g, "");
        if (witelCoords[witel]) {
          const [lat, lng] = witelCoords[witel];
          L.marker([lat, lng], { icon: blinkingIcon })
            .addTo(markersGroup)
            .bindPopup(`Tiket di ${data["WITEL"]}`);
        }
      }
    });

    $('#dataTable tbody').on('click', 'tr', function () {
      const data = table.row(this).data();
      const modalBody = $('#modalContent');
      modalBody.empty();
      Object.entries(data).forEach(([key, value]) => {
        modalBody.append(`<tr><th>${key}</th><td>${value}</td></tr>`);
      });
      const modalEl = document.querySelector('#detailModal .modal-content');
      modalEl.className = 'modal-content ' + (document.body.classList.contains('bg-dark') ? 'dark-mode' : 'light-mode');
      new bootstrap.Modal('#detailModal').show();
    });

    // Auto-refresh
    setInterval(() => {
      markersGroup.clearLayers();
      table.ajax.reload(null, false);
      const nowJakarta = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
      $("#liveStatus").html("Status: <span class='text-success'>Live</span> (Pukul: " + nowJakarta + " WIB)");
    }, 15000);

    // Dark mode toggle
    $('#darkModeSwitch').on('change', function () {
      const isDark = $(this).is(':checked');
      $('html').attr('data-bs-theme', isDark ? 'dark' : 'light');
      $('body').toggleClass('bg-dark text-light', isDark).toggleClass('bg-light text-dark', !isDark);
    });
  });
