const pages=[...document.querySelectorAll('.page')];
const navItems=[...document.querySelectorAll('.nav-item[data-page]')];
const pageTitle=document.getElementById('pageTitle');
const sidebar=document.getElementById('sidebar');
const toast=document.getElementById('toast');
const titles={dashboard:'Overview',consumption:'Consumption',generation:'Generation',battery:'Battery & Storage',assets:'Assets',monitoring:'Live Monitoring',analytics:'Analytics & ML',records:'Energy Records',reports:'Reports',alerts:'Alerts',sources:'Data Sources',settings:'Settings'};
let records=[
 {date:'2026-09-25',zone:'Academic Buildings',type:'Consumption',energy:880,status:'Validated'},
 {date:'2026-09-25',zone:'Solar Installation',type:'Solar',energy:1250,status:'Validated'},
 {date:'2026-09-24',zone:'Hostels',type:'Consumption',energy:700,status:'Validated'},
 {date:'2026-09-24',zone:'EV Charging',type:'EV Charging',energy:120,status:'Validated'},
 {date:'2026-09-23',zone:'Grid',type:'Grid',energy:930,status:'Calculated'},
 {date:'2026-09-22',zone:'Hospital',type:'Consumption',energy:520,status:'Validated'},
 {date:'2026-09-22',zone:'Food Courts',type:'Consumption',energy:310,status:'Validated'},
 {date:'2026-09-21',zone:'Outdoor Facilities',type:'Consumption',energy:140,status:'Validated'}
];
function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2300)}
function navigate(page){
 pages.forEach(p=>p.classList.toggle('active-page',p.id===page));
 navItems.forEach(item=>item.classList.toggle('active',item.dataset.page===page));
 pageTitle.textContent=titles[page]||'Overview';
 if(window.innerWidth<900) sidebar.classList.remove('open');
 window.scrollTo({top:0,behavior:'smooth'});
 if(page==='records') renderRecords();
 if(page==='consumption') renderConsumptionBars();
}
navItems.forEach(item=>item.addEventListener('click',()=>navigate(item.dataset.page)));
document.querySelectorAll('[data-page-jump]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.pageJump)));
document.getElementById('menuButton').addEventListener('click',()=>sidebar.classList.toggle('open'));
function setTheme(theme){document.body.classList.toggle('dark',theme==='dark');localStorage.setItem('energypulse-theme',theme);document.getElementById('settingsTheme').value=theme;document.getElementById('themeToggle').textContent=theme==='dark'?'☀':'☾'}
const savedTheme=localStorage.getItem('energypulse-theme')||'light';setTheme(savedTheme);
document.getElementById('themeToggle').addEventListener('click',()=>setTheme(document.body.classList.contains('dark')?'light':'dark'));
document.getElementById('settingsTheme').addEventListener('change',e=>setTheme(e.target.value));
function renderRecords(){
 const query=(document.getElementById('recordSearch').value||'').toLowerCase();
 const type=document.getElementById('recordType').value;
 const body=document.getElementById('recordsBody');
 const filtered=records.filter(r=>(`${r.date} ${r.zone} ${r.type}`.toLowerCase().includes(query))&&(type==='All types'||r.type===type));
 body.innerHTML=filtered.map(r=>`<tr><td>${r.date}</td><td>${r.zone}</td><td>${r.type}</td><td><b>${Number(r.energy).toLocaleString()} kWh</b></td><td><span class="status-badge">${r.status}</span></td></tr>`).join('')||'<tr><td colspan="5">No records match your filters.</td></tr>';
}
document.getElementById('recordSearch').addEventListener('input',renderRecords);
document.getElementById('recordType').addEventListener('change',renderRecords);
document.getElementById('clearRecords').addEventListener('click',()=>{document.getElementById('recordSearch').value='';document.getElementById('recordType').value='All types';renderRecords()});
function downloadCSV(){
 const rows=[['Date','Zone','Type','Energy (kWh)','Status'],...records.map(r=>[r.date,r.zone,r.type,r.energy,r.status])];
 const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='energypulse-records.csv';a.click();URL.revokeObjectURL(url);showToast('CSV export prepared');
}
document.getElementById('exportButton').addEventListener('click',downloadCSV);
document.getElementById('reportExport').addEventListener('click',downloadCSV);
const modal=document.getElementById('recordModal');
document.getElementById('addRecordButton').addEventListener('click',()=>{document.getElementById('recordDate').value=new Date().toISOString().slice(0,10);modal.classList.remove('hidden')});
document.getElementById('closeModal').addEventListener('click',()=>modal.classList.add('hidden'));
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});

document.getElementById('recordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = document.getElementById('recordDate').value;
    const zone = document.getElementById('recordZone').value;
    const type = document.getElementById('recordKind').value;
    const energy = Number(document.getElementById('recordEnergy').value);

    // Validate energy input
    if (!Number.isFinite(energy) || energy < 0) {
        showToast('Please enter a valid energy value');
        return;
    }

    // Default input features required by the R Decision Tree model
    const features = {
        lights: 100,
        T1: 20,
        T2: 19,
        T3: 19,
        T4: 20,
        T5: 18,
        T6: 19,
        T7: 20,
        T8: 20,
        T9: 19,
        RH_1: 40,
        RH_2: 40,
        RH_3: 40,
        RH_4: 40,
        RH_5: 40,
        RH_6: 40,
        RH_7: 40,
        RH_8: 40,
        RH_9: 40,
        T_out: 15,
        Press_mm_hg: 750,
        RH_out: 60,
        Windspeed: 2,
        Visibility: 40
    };

    const submitButton = e.target.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Generating prediction...';

        // Send features to the R Plumber backend
        const predictionResult = await EnergyPulseAPI.predict(features);

        const predictedEnergy = Number(
            predictionResult.prediction[0]
        ).toFixed(4);

        // Add the record to the frontend table
        records.unshift({
            date: date,
            zone: zone,
            type: type,
            energy: energy,
            status: 'Manual'
        });

        modal.classList.add('hidden');
        e.target.reset();
        renderRecords();

        showToast(
            `Record added. ML prediction: ${predictedEnergy}`
        );

        console.log('Add Reading ML prediction:', {
            enteredEnergy: energy,
            predictedEnergy: predictedEnergy,
            model: predictionResult.model
        });

    } catch (error) {
        console.error('Add Reading prediction error:', error);

        showToast(
            'Prediction failed. Check whether the R backend is running.'
        );

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Save record';
    }
});
document.querySelectorAll('[data-report]').forEach(btn=>btn.addEventListener('click',()=>{
 const type=btn.dataset.report;
 const content={daily:['Daily report preview','Solar generation: 1,250 kWh · Consumption: 2,180 kWh · Grid import: 930 kWh · Grid export: 320 kWh.'],monthly:['Monthly report preview','Compare building-wise demand, source mix, peak load and energy balance over the last 30 days.'],historical:['Historical report preview','Review validated, calculated and simulated records across campus zones with trend and anomaly context.']}[type];
 document.getElementById('reportPreview').innerHTML=`<h3>${content[0]}</h3><p class="muted">${content[1]}</p><div class="insight-banner"><div class="insight-icon">✓</div><div><b>Prototype report ready</b><p>This preview uses demo values and can be connected to a reporting API in the next phase.</p></div></div>`;
}));
document.getElementById('clearAlerts').addEventListener('click',()=>{document.getElementById('alertTable').innerHTML='<div class="insight-banner"><div class="insight-icon">✓</div><div><b>All alerts reviewed</b><p>The alert board has been marked as reviewed for this prototype session.</p></div></div>';document.getElementById('alertCount').textContent='0';showToast('Alerts marked as reviewed')});
function renderConsumptionBars(){const root=document.getElementById('consumptionBars');if(!root||root.children.length)return;const values=[42,55,48,67,78,91,84,62,50,72,88,100,93,76,58,68,82,72,60,52,47,40,36,31];root.innerHTML=values.map(v=>`<i style="height:${v}%"></i>`).join('')}
renderRecords();renderConsumptionBars();
document.getElementById('globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.toLowerCase();if(q.includes('record'))navigate('records');else if(q.includes('solar')||q.includes('generation'))navigate('generation');else if(q.includes('battery'))navigate('battery');else if(q.includes('alert'))navigate('alerts');else if(q.includes('asset')||q.includes('device'))navigate('assets');else showToast('Try searching records, solar, battery, assets or alerts')}});







/* =========================================
   ENERGY PULSE - R BACKEND CONNECTION
   ========================================= */

const ENERGY_PULSE_API = "http://127.0.0.1:8000";

window.EnergyPulseAPI = {

    // Check whether the backend is running
    async health() {
        const response = await fetch(
            `${ENERGY_PULSE_API}/health`
        );

        if (!response.ok) {
            throw new Error("Backend health check failed");
        }

        return await response.json();
    },

    // Get model information
    async modelInfo() {
        const response = await fetch(
            `${ENERGY_PULSE_API}/model-info`
        );

        if (!response.ok) {
            throw new Error("Could not load model information");
        }

        return await response.json();
    },

    // Request an energy prediction
    async predict(features) {
        const response = await fetch(
            `${ENERGY_PULSE_API}/predict`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    data: features
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Prediction request failed"
            );
        }

        return result;
    }
};

console.log("EnergyPulse backend connector loaded");

async function testEnergyPulsePrediction() {
    const features = {
        lights: 100,
        T1: 20,
        T2: 19,
        T3: 19,
        T4: 20,
        T5: 18,
        T6: 19,
        T7: 20,
        T8: 20,
        T9: 19,
        RH_1: 40,
        RH_2: 40,
        RH_3: 40,
        RH_4: 40,
        RH_5: 40,
        RH_6: 40,
        RH_7: 40,
        RH_8: 40,
        RH_9: 40,
        T_out: 15,
        Press_mm_hg: 750,
        RH_out: 60,
        Windspeed: 2,
        Visibility: 40
    };

    try {
        const result = await EnergyPulseAPI.predict(features);

        console.log("EnergyPulse prediction:", result);

        alert(`Predicted energy: ${result.prediction[0]}`);

        return result;

    } catch (error) {
        console.error("Prediction error:", error);
        alert("Prediction failed. Check the backend.");
    }
}

window.testEnergyPulsePrediction = testEnergyPulsePrediction;


/* =========================================
   ENERGY PULSE - DASHBOARD ML PREDICTION
   ========================================= */

function addEnergyPredictionPanel() {
    const analyticsPage = document.getElementById("analytics");

    if (!analyticsPage) {
        console.error("Analytics page not found");
        return;
    }

    // Prevent duplicate panel
    if (document.getElementById("energyPredictionPanel")) {
        return;
    }

    const panel = document.createElement("div");

    panel.id = "energyPredictionPanel";

    panel.style.cssText = `
        margin: 24px 0;
        padding: 24px;
        border: 1px solid #d7e5dc;
        border-radius: 18px;
        background: #f4faf6;
        color: #173b2b;
    `;

    panel.innerHTML = `
        <h3>EnergyPulse ML Prediction</h3>

        <p>
            Generate an energy prediction using the saved R Decision Tree model.
        </p>

        <button id="runEnergyPrediction"
                style="
                    padding: 12px 18px;
                    border: none;
                    border-radius: 10px;
                    background: #217a4b;
                    color: white;
                    cursor: pointer;
                ">
            Run ML Prediction
        </button>

        <p id="energyPredictionResult" style="margin-top: 16px;">
            No prediction generated yet.
        </p>
    `;

    analyticsPage.appendChild(panel);

    document
        .getElementById("runEnergyPrediction")
        .addEventListener("click", async () => {

            const resultElement = document.getElementById(
                "energyPredictionResult"
            );

            resultElement.textContent = "Generating prediction...";

            const features = {
                lights: 100,
                T1: 20,
                T2: 19,
                T3: 19,
                T4: 20,
                T5: 18,
                T6: 19,
                T7: 20,
                T8: 20,
                T9: 19,
                RH_1: 40,
                RH_2: 40,
                RH_3: 40,
                RH_4: 40,
                RH_5: 40,
                RH_6: 40,
                RH_7: 40,
                RH_8: 40,
                RH_9: 40,
                T_out: 15,
                Press_mm_hg: 750,
                RH_out: 60,
                Windspeed: 2,
                Visibility: 40
            };

            try {
                const result = await EnergyPulseAPI.predict(features);

                const prediction = Number(result.prediction[0])
                    .toFixed(4);

                resultElement.innerHTML = `
                    <strong>Predicted Energy:</strong>
                    ${prediction}
                    <br>
                    <small>Model: Decision Tree Regression</small>
                `;

                showToast("ML prediction generated successfully");

            } catch (error) {
                console.error("Prediction error:", error);

                resultElement.textContent =
                    "Prediction failed. Check whether the R backend is running.";
            }
        });
}

// Add the prediction panel after the page loads
addEnergyPredictionPanel();

