import type { Category, MenuCatalog, ModifierGroup, ModifierOption, Product } from "@burger-pos/shared";
import { styles } from "../styles";

type CatalogSectionProps = {
  catalog: MenuCatalog;
  catalogErrors: string[];
  catalogMessage: string | null;
  isSavingCatalog: boolean;
  onAddCategory: () => void;
  onAddModifierGroup: () => void;
  onAddModifierOption: (groupId: string) => void;
  onAddProduct: () => void;
  onRemoveCategory: (categoryId: string) => void;
  onRemoveModifierGroup: (groupId: string) => void;
  onRemoveModifierOption: (groupId: string, optionId: string) => void;
  onRemoveProduct: (productId: string) => void;
  onSaveCatalog: () => void;
  onUpdateCategory: (categoryId: string, patch: Partial<Category>) => void;
  onUpdateModifierGroup: (groupId: string, patch: Partial<ModifierGroup>) => void;
  onUpdateModifierOption: (groupId: string, optionId: string, patch: Partial<ModifierOption>) => void;
  onUpdateProduct: (productId: string, patch: Partial<Product>) => void;
};

export function CatalogSection({
  catalog,
  catalogErrors,
  catalogMessage,
  isSavingCatalog,
  onAddCategory,
  onAddModifierGroup,
  onAddModifierOption,
  onAddProduct,
  onRemoveCategory,
  onRemoveModifierGroup,
  onRemoveModifierOption,
  onRemoveProduct,
  onSaveCatalog,
  onUpdateCategory,
  onUpdateModifierGroup,
  onUpdateModifierOption,
  onUpdateProduct,
}: CatalogSectionProps) {
  return (
    <section style={styles.manualSection}>
      <article style={styles.settingsCard}>
        <p style={styles.eyebrow}>Catalogo</p>
        <h2 style={styles.sectionTitle}>Menu editable</h2>
        <p style={styles.copy}>
          Gestiona categorias, grupos de modificadores y productos desde formularios simples. Los cambios quedan persistidos en el backend.
        </p>

        {catalogErrors.length > 0 ? (
          <div style={styles.validationCard}>
            <strong>No se puede guardar todavia</strong>
            <ul style={styles.validationList}>
              {catalogErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div style={styles.catalogSectionHeader}>
          <div>
            <p style={styles.eyebrow}>Categorias</p>
            <strong>{catalog.categories.length} cargadas</strong>
          </div>
          <button onClick={onAddCategory} style={styles.secondaryButton}>
            Agregar categoria
          </button>
        </div>
        <div style={styles.catalogList}>
          {catalog.categories.map((category) => (
            <div key={category.id} style={styles.catalogCard}>
              <div style={styles.inlineFields}>
                <label style={styles.label}>
                  ID
                  <input
                    value={category.id}
                    onChange={(event) => onUpdateCategory(category.id, { id: event.target.value })}
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Nombre
                  <input
                    value={category.name}
                    onChange={(event) => onUpdateCategory(category.id, { name: event.target.value })}
                    style={styles.input}
                  />
                </label>
              </div>
              <button onClick={() => onRemoveCategory(category.id)} style={styles.removeButton}>
                Quitar categoria
              </button>
            </div>
          ))}
        </div>

        <div style={styles.catalogSectionHeader}>
          <div>
            <p style={styles.eyebrow}>Modificadores</p>
            <strong>{catalog.modifierGroups.length} grupos</strong>
          </div>
          <button onClick={onAddModifierGroup} style={styles.secondaryButton}>
            Agregar grupo
          </button>
        </div>
        <div style={styles.catalogList}>
          {catalog.modifierGroups.map((group) => (
            <div key={group.id} style={styles.catalogCard}>
              <div style={styles.inlineFields}>
                <label style={styles.label}>
                  ID
                  <input
                    value={group.id}
                    onChange={(event) => onUpdateModifierGroup(group.id, { id: event.target.value })}
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Nombre
                  <input
                    value={group.name}
                    onChange={(event) => onUpdateModifierGroup(group.id, { name: event.target.value })}
                    style={styles.input}
                  />
                </label>
              </div>

              <div style={styles.catalogRow}>
                <label style={styles.label}>
                  Tipo
                  <select
                    value={group.type}
                    onChange={(event) =>
                      onUpdateModifierGroup(group.id, { type: event.target.value as ModifierGroup["type"] })
                    }
                    style={styles.input}
                  >
                    <option value="single">Single</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={(event) => onUpdateModifierGroup(group.id, { required: event.target.checked })}
                  />
                  Requerido
                </label>
                <label style={styles.label}>
                  Min
                  <input
                    type="number"
                    min={0}
                    value={group.min ?? ""}
                    onChange={(event) =>
                      onUpdateModifierGroup(group.id, {
                        min: event.target.value === "" ? undefined : Number(event.target.value),
                      })
                    }
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Max
                  <input
                    type="number"
                    min={0}
                    value={group.max ?? ""}
                    onChange={(event) =>
                      onUpdateModifierGroup(group.id, {
                        max: event.target.value === "" ? undefined : Number(event.target.value),
                      })
                    }
                    style={styles.input}
                  />
                </label>
              </div>

              <div style={styles.catalogNestedHeader}>
                <strong>Opciones</strong>
                <button onClick={() => onAddModifierOption(group.id)} style={styles.secondaryButton}>
                  Agregar opcion
                </button>
              </div>
              <div style={styles.catalogNestedList}>
                {group.options.map((option) => (
                  <div key={option.id} style={styles.catalogNestedCard}>
                    <div style={styles.inlineFields}>
                      <label style={styles.label}>
                        ID
                        <input
                          value={option.id}
                          onChange={(event) => onUpdateModifierOption(group.id, option.id, { id: event.target.value })}
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Nombre
                        <input
                          value={option.name}
                          onChange={(event) =>
                            onUpdateModifierOption(group.id, option.id, { name: event.target.value })
                          }
                          style={styles.input}
                        />
                      </label>
                    </div>
                    <div style={styles.catalogRow}>
                      <label style={styles.label}>
                        Precio
                        <input
                          type="number"
                          min={0}
                          value={option.price}
                          onChange={(event) =>
                            onUpdateModifierOption(group.id, option.id, { price: Number(event.target.value) || 0 })
                          }
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={Boolean(option.isRemovable)}
                          onChange={(event) =>
                            onUpdateModifierOption(group.id, option.id, { isRemovable: event.target.checked })
                          }
                        />
                        Removible
                      </label>
                      <button onClick={() => onRemoveModifierOption(group.id, option.id)} style={styles.removeButton}>
                        Quitar opcion
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => onRemoveModifierGroup(group.id)} style={styles.removeButton}>
                Quitar grupo
              </button>
            </div>
          ))}
        </div>

        <div style={styles.catalogSectionHeader}>
          <div>
            <p style={styles.eyebrow}>Productos</p>
            <strong>{catalog.products.length} items</strong>
          </div>
          <button onClick={onAddProduct} style={styles.secondaryButton}>
            Agregar producto
          </button>
        </div>
        <div style={styles.catalogList}>
          {catalog.products.map((product) => (
            <div key={product.id} style={styles.catalogCard}>
              <div style={styles.inlineFields}>
                <label style={styles.label}>
                  ID
                  <input
                    value={product.id}
                    onChange={(event) => onUpdateProduct(product.id, { id: event.target.value })}
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Nombre
                  <input
                    value={product.name}
                    onChange={(event) => onUpdateProduct(product.id, { name: event.target.value })}
                    style={styles.input}
                  />
                </label>
              </div>
              <label style={styles.label}>
                Descripcion
                <input
                  value={product.description ?? ""}
                  onChange={(event) => onUpdateProduct(product.id, { description: event.target.value })}
                  style={styles.input}
                />
              </label>
              <div style={styles.catalogRow}>
                <label style={styles.label}>
                  Precio
                  <input
                    type="number"
                    min={0}
                    value={product.price}
                    onChange={(event) => onUpdateProduct(product.id, { price: Number(event.target.value) || 0 })}
                    style={styles.input}
                  />
                </label>
                <label style={styles.label}>
                  Categoria
                  <select
                    value={product.categoryId}
                    onChange={(event) => onUpdateProduct(product.id, { categoryId: event.target.value })}
                    style={styles.input}
                  >
                    {catalog.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={styles.label}>
                Grupos de modificadores
                <select
                  multiple
                  value={product.modifierGroupIds}
                  onChange={(event) =>
                    onUpdateProduct(product.id, {
                      modifierGroupIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                    })
                  }
                  style={styles.multiSelect}
                >
                  {catalog.modifierGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => onRemoveProduct(product.id)} style={styles.removeButton}>
                Quitar producto
              </button>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <div>
            <p style={styles.eyebrow}>Persistencia</p>
            <strong>Backend + archivo del local</strong>
          </div>
          <button
            onClick={onSaveCatalog}
            disabled={isSavingCatalog || catalogErrors.length > 0}
            style={{
              ...styles.actionButton,
              ...(isSavingCatalog || catalogErrors.length > 0 ? styles.buttonDisabled : {}),
            }}
          >
            {isSavingCatalog ? "Guardando..." : "Guardar catalogo"}
          </button>
        </div>
        {catalogMessage ? (
          <p style={catalogErrors.length > 0 ? styles.warningText : styles.successText}>{catalogMessage}</p>
        ) : null}
      </article>
    </section>
  );
}
