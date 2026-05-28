// =========================
// LOAD DICTIONARIES
// =========================

async function loadDatalist(jsonPath, datalistId) {

    try {

        const response = await fetch(jsonPath);

        const values = await response.json();

        const datalist = document.getElementById(datalistId);

        values.forEach(value => {

            const option = document.createElement("option");

            option.value = value;

            datalist.appendChild(option);

        });

    } catch (err) {

        console.error(
            "Ошибка загрузки:",
            jsonPath,
            err
        );

    }
}

// cities
loadDatalist(
    "values_delivery_city.json",
    "city_list"
);

// regions
loadDatalist(
    "values_delivery_region.json",
    "region_list"
);

// industries
loadDatalist(
    "values_industry_scope.json",
    "industry_list"
);


async function predict() {
    const resultDiv = document.getElementById("result");
    const btn = document.querySelector("button");

    const price = document.getElementById("price").value;
    const region =
    document.getElementById("region").value.trim();

    const publicationName =
        document.getElementById("publication_name").value.trim();

    // --- проверка ---
    const missingFields = [];

    if (!formData.customer_price_rub) {
        missingFields.push("начальную цену");
    }
    
    if (!formData.region_name) {
        missingFields.push("регион проведения закупки");
    }
    
    if (!formData.publication_name?.trim()) {
        missingFields.push("название публикации");
    }
    
    let errorText = "";
    
    if (missingFields.length === 1) {
        errorText = `Укажите ${missingFields[0]}`;
    }
    
    if (missingFields.length === 2) {
        errorText = `Укажите ${missingFields[0]} и ${missingFields[1]}`;
    }
    
    if (missingFields.length >= 3) {
        errorText =
            `Укажите ${missingFields.slice(0, -1).join(", ")} ` +
            `и ${missingFields[missingFields.length - 1]}`;
    }

    // --- проверка industry ---
    const industryInput = document.getElementById("industry");
    const options = document.querySelectorAll("#industry_list option");

    const validValues = Array.from(options).map(o => o.value);

    if (industryInput.value && !validValues.includes(industryInput.value)) {
        resultDiv.className = "result error";
        resultDiv.innerHTML = "Выберите значение из списка";
        resultDiv.style.display = "block";
        return;
    }

    // --- дата ---
    const datetime =
    document.getElementById("publication_datetime").value;

    const applicationsDeadlineDatetime =
        document.getElementById("applications_deadline_datetime").value;
    
    const applicationsStartDatetime =
        document.getElementById("applications_start_datetime").value;
    
    const tradingEndDatetime =
        document.getElementById("trading_end_datetime").value;

    // --- собираем данные ---
    const data = {
        customer_price_rub: parseFloat(price),
        delivery_region: document.getElementById("region").value,
        trade_type: document.getElementById("trade").value,
        electronic_trade_mode: document.getElementById("mode").value || null,
        trading_platform: document.getElementById("platform").value || null,
        industry_scope: industryInput.value || null,
        publication_datetime: datetime || null,

        // чекбоксы
        has_purchase_code: document.getElementById("has_purchase_code").checked ? 1 : 0,
        national_regime_flag: document.getElementById("national_regime_flag").checked ? 1 : 0,

        delivery_city: document.getElementById("delivery_city").value || null,
        
        publication_name: document.getElementById("publication_name").value || null,
        
        bid_security_rub: parseFloat(document.getElementById("bid_security_rub").value) || 0,
        
        bid_security_pct: parseFloat(document.getElementById("bid_security_pct").value) || 0,
        
        contract_security_rub: parseFloat(document.getElementById("contract_security_rub").value) || 0,
        
        contract_security_pct: parseFloat(document.getElementById("contract_security_pct").value) || 0,
        
        bank_treasury_support: document.getElementById("bank_treasury_support").value || null,
        
        num_participants: parseInt(document.getElementById("num_participants").value) || 0,
        
        applications_deadline_datetime: applicationsDeadlineDatetime || null,
        
        applications_start_datetime: applicationsStartDatetime || null,
        
        trading_end_datetime: tradingEndDatetime || null,
    };

    try {
        btn.disabled = true;

        resultDiv.className = "result";
        resultDiv.innerHTML = "⏳ Считаем...";
        resultDiv.style.display = "block";

        // --- запрос прогноза цены ---
        const priceResponse = await fetch(
            "https://project-2026-ekaterina-moroz.amvera.io/predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
        
        const priceRes = await priceResponse.json();
        
        // --- запрос прогноза демпинга ---
        const dumpingResponse = await fetch(
            "https://project-2026-ekaterina-moroz.amvera.io/predict_dumping",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
        
        const dumpingRes = await dumpingResponse.json();
        
        // --- ошибки ---
        if (priceRes.error) {
            resultDiv.className = "result error";
            resultDiv.innerHTML = "Ошибка: " + priceRes.error;
            return;
        }
        
        if (dumpingRes.error) {
            resultDiv.className = "result error";
            resultDiv.innerHTML = "Ошибка: " + dumpingRes.error;
            return;
        }
        
        // --- результаты ---
        const drop = priceRes.predicted_drop_pct * 100;

        const conservativePrice =
            priceRes.predicted_final_price_upper;
        
        const aggressivePrice =
            priceRes.predicted_final_price_lower;
        
        const isDumping = dumpingRes.is_dumping;

        const dumpingConfidence = Math.max(
            dumpingRes.dumping_probability,
            1 - dumpingRes.dumping_probability
        ) * 100;
        
        let dumpingText = "";
        
        if (isDumping) {
            dumpingText =
                "⚠️ Модель выявила высокий риск демпинга. Рекомендуется обратить внимание.";
        } else {
            dumpingText =
                "✅ Признаков демпинга не обнаружено";
        }
        
resultDiv.className = "result-card";

resultDiv.innerHTML = `

<div class="result-header">

    <div class="result-header-icon">
        <i data-lucide="bar-chart-3"></i>
    </div>

    <div class="result-title">
        Прогноз и оценка
    </div>

</div>

<div class="result-grid">

    <!-- DROP -->

    <div class="metric-card">

        <div class="metric-top">

            <div class="metric-icon red">
                <i data-lucide="trending-down"></i>
            </div>

            <div class="metric-label">
                Снижение цены
            </div>

        </div>

        <div class="metric-value">
            ${drop.toFixed(2)}%
        </div>

        <div class="metric-description">
            Ожидаемое снижение начальной цены контракта
        </div>

    </div>

    <!-- PRICE -->

    <div class="metric-card">

        <div class="metric-top">

            <div class="metric-icon green">
                <i data-lucide="badge-russian-ruble"></i>
            </div>

            <div class="metric-label">
                Итоговая цена
            </div>

        </div>

        <div class="metric-value">
            ${priceRes.predicted_final_price.toLocaleString("ru-RU")} ₽
        </div>

        <div class="metric-description">
            Прогнозируемая итоговая стоимость контракта
        </div>
        
        <div class="metric-subvalues">
        
            <div>
                Консервативный сценарий:
                ${conservativePrice.toLocaleString("ru-RU")} ₽
            </div>
        
            <div>
                Агрессивный сценарий:
                ${aggressivePrice.toLocaleString("ru-RU")} ₽
            </div>
        
        </div>

    </div>

    <!-- DUMPING -->

    <div class="metric-card">

        <div class="metric-top">

            <div class="metric-icon blue">
                <i data-lucide="shield-check"></i>
            </div>

            <div class="metric-label">
                Признак демпинга
            </div>

        </div>

        <div class="metric-value">
            ${isDumping ? "Обнаружен" : "Не обнаружено"}
        </div>

        <div class="metric-description">
            ${
                isDumping
                ? "Модель выявила признаки аномального снижения цены"
                : "Признаков демпинга не выявлено"
            }
        </div>

<div class="metric-subvalues">

    <div>
        Уверенность модели:
        ${dumpingConfidence.toFixed(1)}%
    </div>

</div>

    </div>

</div>

<div class="result-footer">

    Прогноз построен на основе исторических данных
    о торгах, параметров закупки и рыночных факторов.

</div>
`;

lucide.createIcons();

    } catch (err) {
    
        console.error(err);
    
        resultDiv.className = "result error";
    
        resultDiv.innerHTML =
            "Что-то пошло не так. Попробуйте позднее.";
    
    } finally {
        btn.disabled = false;
    }
}
