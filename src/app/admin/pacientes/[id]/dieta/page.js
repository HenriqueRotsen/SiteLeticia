"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Activity } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import FatSecretAttribution from "@/components/ui/FatSecretAttribution";
import BmrPanel from "@/components/ui/BmrPanel";
import DietNutrientAnalysis from "@/components/ui/DietNutrientAnalysis";
import FoodSourceToggles, { buildSearchPlaceholder } from "@/components/ui/FoodSourceToggles";
import MealNutrientAnalysis from "@/components/ui/MealNutrientAnalysis";
import Modal from "@/components/ui/Modal";
import { computePatientMetabolism } from "@/lib/metabolism/bmr";
import {
  DEFAULT_FOOD_SOURCES,
  FOOD_SOURCES,
  foodSourceLabel,
  usesFatSecretInResults
} from "@/lib/foods/sources";
import { Card, inputClassName } from "@/components/layout/AppShell";
import {
  formatPer100g,
  formatScaledNutrition,
  sanitizePer100g,
  sumNutrition
} from "@/lib/foods/nutrition";
import {
  MEASURE_UNITS,
  buildNutritionSnapshot,
  formatMeasureLabel,
  getMeasureUnit,
  measureQuantityLabel,
  normalizeMeasureAmount,
  restoreMeasureFromStored,
  toStoredPortion
} from "@/lib/foods/measures";

const DEFAULT_MEAL_NAMES = ["Café da manhã", "Almoço", "Lanche", "Jantar"];

function defaultPlanTitle(patientName) {
  const name = patientName?.trim();
  return name ? `Plano Alimentar - ${name}` : "Plano Alimentar";
}

function createMeal(name, items = []) {
  return {
    clientId: crypto.randomUUID(),
    name,
    items
  };
}

function createItem(food) {
  const defaultGrams = food.defaultPortionG || 100;
  const portion = toStoredPortion("gramas", defaultGrams);

  return {
    clientId: crypto.randomUUID(),
    source: food.source,
    externalId: food.externalId,
    label: food.label,
    per100g: food.per100g ? sanitizePer100g(food.per100g) : null,
    measureUnit: portion.measureUnit,
    measureAmount: portion.measureAmount,
    quantity: portion.quantity,
    portionG: portion.portionG
  };
}

function MealSearchPanel({ onAddFood, addingId, enabledSources }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [capabilities, setCapabilities] = useState({});
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    fetch("/api/foods/capabilities")
      .then((response) => response.json())
      .then((data) => setCapabilities(data.capabilities || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    setLoadingSearch(true);
    setSearchError("");
    const sources = enabledSources.join(",");

    const t = setTimeout(() => {
      fetch(
        `/api/foods/search?q=${encodeURIComponent(query)}&provider=mixed&sources=${encodeURIComponent(sources)}`,
        { signal: controller.signal }
      )
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Erro na busca.");
          }
          return data;
        })
        .then((data) => {
          setResults(data.results || []);
          if (data.capabilities) setCapabilities(data.capabilities);
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setResults([]);
          setSearchError(error.message || "Não foi possível buscar alimentos.");
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoadingSearch(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, enabledSources]);

  const missingUsda =
    enabledSources.includes(FOOD_SOURCES.USDA) && capabilities.usdaConfigured === false;
  const missingFatSecret =
    enabledSources.includes(FOOD_SOURCES.FATSECRET) && capabilities.fatsecretConfigured === false;

  return (
    <div className="mb-4 rounded-xl border border-dashed border-olive-900/15 bg-linen/30 p-3">
      <label className="mb-1 block text-xs font-medium text-graphite/60">Buscar alimento</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClassName()}
        placeholder={buildSearchPlaceholder(enabledSources)}
      />

      {missingUsda ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          USDA selecionado, mas USDA_API_KEY não está configurada no servidor.
        </p>
      ) : null}

      {missingFatSecret ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          FatSecret selecionado, mas as chaves não estão configuradas ou o IP não está liberado.
        </p>
      ) : null}

      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {loadingSearch ? <p className="text-sm text-graphite/60">Buscando...</p> : null}
        {searchError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {searchError}
          </p>
        ) : null}
        {!loadingSearch && !searchError && query.length >= 2 && results.length === 0 ? (
          <p className="text-sm text-graphite/60">Nenhum alimento encontrado.</p>
        ) : null}
        {results.map((item) => (
          <button
            key={`${item.source}-${item.externalId}`}
            type="button"
            disabled={addingId === item.externalId}
            onClick={() => onAddFood(item)}
            className="block w-full rounded-lg border border-olive-900/10 bg-white px-3 py-2 text-left text-sm hover:bg-olive-50 disabled:opacity-60"
          >
            <span className="font-medium text-graphite">{item.label}</span>
            <span className="ml-2 text-xs font-medium text-olive-700">{foodSourceLabel(item.source)}</span>
            {formatPer100g(item.per100g) ? (
              <span className="mt-1 block text-xs text-graphite/60">{formatPer100g(item.per100g)}</span>
            ) : null}
          </button>
        ))}
      </div>

      {usesFatSecretInResults(results) ? (
        <FatSecretAttribution className="mt-3 border-t border-olive-900/5 pt-2" />
      ) : null}
    </div>
  );
}

function mapPlanToMeals(plan) {
  return (plan.diet_meals || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((meal) =>
      createMeal(
        meal.name,
        (meal.diet_items || []).map((item) => {
          const restored = restoreMeasureFromStored(item.quantity, item.portion_g, item.nutrition_snapshot);

          return {
            clientId: item.id,
            source: item.source,
            externalId: item.external_id,
            label: item.label,
            per100g: restored.per100g ? sanitizePer100g(restored.per100g) : null,
            measureUnit: restored.measureUnit,
            measureAmount: restored.measureAmount,
            quantity: restored.quantity,
            portionG: restored.portionG
          };
        })
      )
    );
}

export default function AdminDietBuilderPage() {
  const params = useParams();
  const [addingId, setAddingId] = useState(null);
  const [foodSources, setFoodSources] = useState(DEFAULT_FOOD_SOURCES);
  const [searchCapabilities, setSearchCapabilities] = useState({});
  const [patient, setPatient] = useState(null);
  const [title, setTitle] = useState("Plano Alimentar");
  const [meals, setMeals] = useState(() => DEFAULT_MEAL_NAMES.map((name) => createMeal(name)));
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [tmbOpen, setTmbOpen] = useState(false);

  const allItems = useMemo(() => meals.flatMap((meal) => meal.items), [meals]);
  const planTotals = useMemo(() => sumNutrition(allItems), [allItems]);
  const targetGetKcal = useMemo(() => {
    if (!patient) return null;

    const metabolism = computePatientMetabolism({
      sex: patient.sex,
      birthDate: patient.birth_date,
      heightCm: patient.height_cm,
      weightKg: patient.latest_weight_kg,
      bodyFatPercent: patient.body_fat_percent,
      activityLevel: patient.activity_level || "sedentary"
    });

    return metabolism.ok ? metabolism.getKcal : null;
  }, [patient]);

  useEffect(() => {
    fetch("/api/foods/capabilities")
      .then((response) => response.json())
      .then((data) => setSearchCapabilities(data.capabilities || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/admin/patients/${params.id}`).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Erro ao carregar paciente.");
        }
        return data;
      }),
      fetch(`/api/patients/${params.id}/diet`).then((response) => response.json())
    ])
      .then(([patientData, dietData]) => {
        if (cancelled) return;

        const patientName = patientData.patient?.full_name;
        const defaultTitle = defaultPlanTitle(patientName);
        setPatient(patientData.patient || null);
        const plan =
          dietData.dietPlans?.find((row) => row.status === "active") || dietData.dietPlans?.[0];

        if (plan) {
          setTitle(plan.title || defaultTitle);
          const loadedMeals = mapPlanToMeals(plan);
          if (loadedMeals.length) setMeals(loadedMeals);
        } else {
          setTitle(defaultTitle);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  function updateMeals(updater) {
    setMeals((current) => (typeof updater === "function" ? updater(current) : updater));
  }

  async function addFood(mealId, item) {
    setAddingId(item.externalId);
    try {
      let food = item;

      if (food.source === "fatsecret") {
        const res = await fetch(`/api/foods/fatsecret/${encodeURIComponent(item.externalId)}`);
        const data = await res.json();
        if (res.ok && data.food?.per100g?.kcal) {
          food = data.food;
        } else if (!food.per100g?.kcal) {
          setFeedback("Não foi possível carregar os nutrientes deste alimento do FatSecret.");
          return;
        }
      } else if (food.source === "usda") {
        const res = await fetch(`/api/foods/usda/${encodeURIComponent(item.externalId)}`);
        const data = await res.json();
        if (res.ok && data.food?.per100g?.kcal) {
          food = data.food;
        } else if (!food.per100g?.kcal) {
          setFeedback("Não foi possível carregar os nutrientes deste alimento do USDA.");
          return;
        }
      }

      updateMeals((current) =>
        current.map((meal) =>
          meal.clientId === mealId ? { ...meal, items: [...meal.items, createItem(food)] } : meal
        )
      );
      setFeedback("");
    } finally {
      setAddingId(null);
    }
  }

  function removeItem(mealId, itemId) {
    updateMeals((current) =>
      current.map((meal) =>
        meal.clientId === mealId
          ? { ...meal, items: meal.items.filter((item) => item.clientId !== itemId) }
          : meal
      )
    );
  }

  function updateItem(mealId, itemId, patch) {
    updateMeals((current) =>
      current.map((meal) =>
        meal.clientId === mealId
          ? {
              ...meal,
              items: meal.items.map((item) => {
                if (item.clientId !== itemId) return item;

                const measureUnit = patch.measureUnit ?? item.measureUnit;
                let measureAmount = item.measureAmount;

                if (patch.measureAmount != null) {
                  measureAmount = normalizeMeasureAmount(measureUnit, patch.measureAmount);
                } else if (patch.measureUnit != null) {
                  measureAmount = normalizeMeasureAmount(measureUnit, item.measureAmount);
                }

                const stored = toStoredPortion(measureUnit, measureAmount);

                return {
                  ...item,
                  ...patch,
                  measureUnit: stored.measureUnit,
                  measureAmount: stored.measureAmount,
                  quantity: stored.quantity,
                  portionG: stored.portionG
                };
              })
            }
          : meal
      )
    );
  }

  function renameMeal(mealId, name) {
    updateMeals((current) =>
      current.map((meal) => (meal.clientId === mealId ? { ...meal, name } : meal))
    );
  }

  function addMeal() {
    const meal = createMeal("Nova refeição");
    updateMeals((current) => [...current, meal]);
  }

  function removeMeal(mealId) {
    if (meals.length <= 1) return;
    updateMeals((current) => current.filter((meal) => meal.clientId !== mealId));
  }

  async function savePlan() {
    const mealsWithItems = meals.filter((meal) => meal.items.length > 0);
    if (!mealsWithItems.length) {
      setFeedback("Adicione ao menos um alimento em alguma refeição.");
      return;
    }

    setSaving(true);
    setFeedback("");

    const res = await fetch(`/api/patients/${params.id}/diet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        status: "active",
        meals: mealsWithItems.map((meal, index) => ({
          name: meal.name.trim() || `Refeição ${index + 1}`,
          sortOrder: index,
          items: meal.items.map((item) => {
            const stored = toStoredPortion(item.measureUnit, item.measureAmount);

            return {
              source: item.source,
              externalId: item.externalId,
              label: item.label,
              quantity: stored.quantity,
              portionG: stored.portionG,
              nutritionSnapshot: buildNutritionSnapshot(
                item.per100g,
                item.measureUnit,
                item.measureAmount
              )
            };
          })
        }))
      })
    });

    const data = await res.json();
    setSaving(false);
    setFeedback(res.ok ? "Plano salvo." : data.message || "Erro ao salvar.");
  }

  return (
    <AdminShell title="Montar dieta" breadcrumbs={["Admin", "Dieta"]} userName="Letícia">
      <Card className="mb-4 overflow-hidden border-olive-600/25 bg-gradient-to-br from-olive-200/70 via-olive-100/80 to-porcelain p-0 shadow-soft ring-1 ring-olive-700/15">
        <div className="border-b border-olive-700/10 bg-olive-700/90 px-5 py-3 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-porcelain/75">
            Configuração do plano
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-olive-900/70">Título do plano</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClassName()}
                placeholder="Plano Alimentar - Nome do paciente"
              />
            </div>
            <button
              type="button"
              onClick={() => setTmbOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-olive-700/15 bg-white px-3 py-2.5 text-sm font-semibold text-olive-800 shadow-sm hover:bg-olive-50"
            >
              <Activity className="h-4 w-4" />
              TMB
            </button>
            <button
              type="button"
              onClick={addMeal}
              className="inline-flex items-center gap-2 rounded-xl border border-olive-700/15 bg-white px-3 py-2.5 text-sm font-medium text-olive-800 shadow-sm hover:bg-olive-50"
            >
              <Plus className="h-4 w-4" />
              Refeição
            </button>
          </div>
          <FoodSourceToggles
            enabledSources={foodSources}
            onChange={setFoodSources}
            capabilities={searchCapabilities}
            className="mt-4"
          />
        </div>
      </Card>

      <Modal open={tmbOpen} onClose={() => setTmbOpen(false)} title="Taxa Metabólica Basal (TMB)">
        <BmrPanel
          patient={patient}
          planKcal={Math.round(planTotals.kcal)}
          onSaved={setPatient}
        />
      </Modal>

      <div className="mb-4 grid gap-4">
        {meals.map((meal) => {
          return (
            <Card key={meal.clientId}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <input
                  value={meal.name}
                  onChange={(e) => renameMeal(meal.clientId, e.target.value)}
                  className={`min-w-[180px] flex-1 ${inputClassName()}`}
                  placeholder="Nome da refeição"
                />
                {meals.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeMeal(meal.clientId)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover refeição
                  </button>
                ) : null}
              </div>

              <MealSearchPanel
                addingId={addingId}
                enabledSources={foodSources}
                onAddFood={(item) => addFood(meal.clientId, item)}
              />

              {!meal.items.length ? (
                <p className="text-sm text-graphite/50">Nenhum alimento nesta refeição.</p>
              ) : (
                <ul className="space-y-3">
                  {meal.items.map((item) => (
                    <li
                      key={item.clientId}
                      className="rounded-xl border border-olive-900/10 bg-linen/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-graphite">{item.label}</p>
                          {formatPer100g(item.per100g) ? (
                            <p className="mt-1 text-xs text-graphite/50">{formatPer100g(item.per100g)}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(meal.clientId, item.clientId)}
                          className="rounded-lg p-2 text-graphite/45 hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Remover ${item.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs text-graphite/60">
                          Medida
                          <select
                            value={item.measureUnit}
                            onChange={(e) =>
                              updateItem(meal.clientId, item.clientId, { measureUnit: e.target.value })
                            }
                            className={`mt-1 ${inputClassName()}`}
                          >
                            {MEASURE_UNITS.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs text-graphite/60">
                          {measureQuantityLabel(item.measureUnit)}
                          <input
                            type="number"
                            min={getMeasureUnit(item.measureUnit).min}
                            step={getMeasureUnit(item.measureUnit).step}
                            value={item.measureAmount}
                            onChange={(e) =>
                              updateItem(meal.clientId, item.clientId, { measureAmount: e.target.value })
                            }
                            className={`mt-1 ${inputClassName()}`}
                          />
                        </label>
                      </div>

                      <p className="mt-2 text-xs text-graphite/55">
                        Porção: {formatMeasureLabel(item.measureUnit, item.measureAmount)}
                      </p>

                      {formatScaledNutrition(item.per100g, item.quantity, item.portionG) ? (
                        <p className="mt-3 text-sm font-medium text-olive-800">
                          {formatScaledNutrition(item.per100g, item.quantity, item.portionG)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {meal.items.length ? (
                <MealNutrientAnalysis
                  mealName={meal.name}
                  items={meal.items}
                  patientGoal={patient?.goal}
                />
              ) : null}
            </Card>
          );
        })}
      </div>

      {usesFatSecretInResults(allItems) ? (
        <Card className="mb-4 bg-linen/40">
          <FatSecretAttribution />
        </Card>
      ) : null}

      <DietNutrientAnalysis
        totals={planTotals}
        items={allItems}
        itemCount={allItems.length}
        mealCount={meals.filter((meal) => meal.items.length).length}
        targetKcal={targetGetKcal}
        targetLabel="Meta (GET)"
        patientGoal={patient?.goal}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Salvar plano alimentar</h3>
            <p className="mt-1 text-sm text-graphite/60">
              Revise a análise acima antes de publicar para o paciente.
            </p>
          </div>
          <button
            type="button"
            onClick={savePlan}
            disabled={saving || allItems.length === 0}
            className="rounded-xl bg-olive-700 px-5 py-3 text-sm font-semibold text-white hover:bg-olive-800 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar plano"}
          </button>
        </div>
        {feedback ? <p className="mt-3 text-sm">{feedback}</p> : null}
      </Card>
    </AdminShell>
  );
}
