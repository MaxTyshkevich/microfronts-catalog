import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsKey, sessionKey } from "@microfronts/contracts";
import { Plus } from "lucide-react";
import { useSession } from "../../../entities/session";
import { useCategories } from "../../../entities/category";
import { HttpError, type RequestContext } from "../../../shared/api";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
  Textarea,
  fieldClassName,
} from "../../../shared/ui";
import { createProduct } from "../api/create-product";

interface Fields {
  id: string;
  title: string;
  description: string;
  price: string;
  categoryId: string;
}

export function CreateProductDialog({ context }: { context: RequestContext }) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState("");
  const client = useQueryClient();
  const session = useSession(context);
  const user = session.data?.user;
  const isAdmin = session.isSuccess && user?.role === "ADMIN";
  const categories = useCategories(context);
  const prefix = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Fields>();
  const mutation = useMutation({
    mutationFn: (fields: Fields) =>
      createProduct(
        {
          ...context,
          sessionScope: context.sessionScope ?? (user ? "user:" + user.id : undefined),
        },
        {
          id: fields.id.trim(),
          title: fields.title.trim(),
          description: fields.description.trim(),
          priceMinor: Math.round(Number(fields.price) * 100),
          categoryId: fields.categoryId,
        },
      ),
    onSuccess: (product) => {
      setCreated("Создан товар: " + product.title);
      setOpen(false);
      reset();
      void client.invalidateQueries({ queryKey: productsKey(context.apiBaseUrl) });
    },
    onError: (error) => {
      if (error instanceof HttpError && [401, 403].includes(error.status)) {
        void client.invalidateQueries({ queryKey: sessionKey(context.apiBaseUrl) });
      }
    },
    retry: false,
  });

  function changeOpen(next: boolean) {
    if (mutation.isPending) return;
    setOpen(next);
    if (next) {
      mutation.reset();
      setCreated("");
      reset();
    }
  }

  return (
    <div>
      {created && (
        <p role="status" className="catalog:m-0 catalog:text-sm">
          {created}
        </p>
      )}
      <Dialog open={open} onOpenChange={changeOpen}>
        {isAdmin && (
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} aria-hidden="true" />
              Создать товар
            </Button>
          </DialogTrigger>
        )}
        <DialogContent>
          <div className="catalog:grid catalog:gap-2 catalog:pr-6">
            <DialogTitle className="catalog:m-0 catalog:text-xl catalog:font-semibold">
              Создать товар
            </DialogTitle>
            <DialogDescription className="catalog:m-0 catalog:text-sm catalog:text-muted-foreground">
              Добавьте товар в каталог. Все цены указаны в USD.
            </DialogDescription>
          </div>
          <form
            noValidate
            onSubmit={handleSubmit((fields) => mutation.mutate(fields))}
            className="catalog:grid catalog:gap-4"
          >
            <fieldset
              disabled={mutation.isPending}
              className="catalog:m-0 catalog:grid catalog:min-w-0 catalog:gap-4 catalog:border-0 catalog:p-0"
            >
              <div className="catalog:grid catalog:gap-1.5">
                <label htmlFor={prefix + "id"} className="catalog:text-sm catalog:font-medium">
                  ID товара
                </label>
                <Input
                  id={prefix + "id"}
                  autoComplete="off"
                  maxLength={100}
                  aria-invalid={!!errors.id}
                  aria-describedby={prefix + "id-help"}
                  {...register("id", {
                    required: "Укажите ID товара",
                    maxLength: 100,
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message: "Используйте латинские строчные буквы, цифры и дефисы",
                    },
                  })}
                />
                <p
                  id={prefix + "id-help"}
                  className="catalog:m-0 catalog:text-xs catalog:text-muted-foreground"
                >
                  Например, wireless-keyboard. ID должен быть уникальным.
                </p>
                {errors.id && (
                  <p role="alert" className="catalog:m-0 catalog:text-sm">
                    {errors.id.message}
                  </p>
                )}
              </div>
              <div className="catalog:grid catalog:gap-1.5">
                <label htmlFor={prefix + "title"} className="catalog:text-sm catalog:font-medium">
                  Название
                </label>
                <Input
                  id={prefix + "title"}
                  maxLength={200}
                  aria-invalid={!!errors.title}
                  {...register("title", {
                    validate: (value) => !!value?.trim() || "Укажите название",
                    maxLength: 200,
                  })}
                />
                {errors.title && (
                  <p role="alert" className="catalog:m-0 catalog:text-sm">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="catalog:grid catalog:gap-1.5">
                <label
                  htmlFor={prefix + "description"}
                  className="catalog:text-sm catalog:font-medium"
                >
                  Описание
                </label>
                <Textarea
                  id={prefix + "description"}
                  maxLength={10000}
                  aria-invalid={!!errors.description}
                  {...register("description", {
                    validate: (value) => !!value?.trim() || "Укажите описание",
                    maxLength: 10000,
                  })}
                />
                {errors.description && (
                  <p role="alert" className="catalog:m-0 catalog:text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="catalog:grid catalog:gap-1.5">
                <label htmlFor={prefix + "price"} className="catalog:text-sm catalog:font-medium">
                  Цена, USD
                </label>
                <Input
                  id={prefix + "price"}
                  type="number"
                  min="0"
                  max="21474836.47"
                  step="0.01"
                  inputMode="decimal"
                  aria-invalid={!!errors.price}
                  {...register("price", {
                    validate: (value) =>
                      (/^\d+(?:\.\d{1,2})?$/.test(value) && Number(value) <= 21474836.47) ||
                      "Укажите цену от 0 до 21474836.47 с точностью до цента",
                  })}
                />
                {errors.price && (
                  <p role="alert" className="catalog:m-0 catalog:text-sm">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div className="catalog:grid catalog:gap-1.5">
                <label
                  htmlFor={prefix + "category"}
                  className="catalog:text-sm catalog:font-medium"
                >
                  Категория
                </label>
                <select
                  id={prefix + "category"}
                  className={fieldClassName}
                  defaultValue=""
                  aria-invalid={!!errors.categoryId}
                  {...register("categoryId", { required: "Выберите категорию" })}
                >
                  <option value="" disabled>
                    Выберите категорию
                  </option>
                  {categories.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p role="alert" className="catalog:m-0 catalog:text-sm">
                    {errors.categoryId.message}
                  </p>
                )}
                {categories.isError && (
                  <div role="alert">
                    Не удалось загрузить категории.{" "}
                    <Button variant="outline" onClick={() => void categories.refetch()}>
                      Повторить
                    </Button>
                  </div>
                )}
              </div>
            </fieldset>
            {mutation.isError && (
              <p role="alert" className="catalog:m-0 catalog:text-sm">
                {mutation.error.message}
              </p>
            )}
            {!isAdmin && open && (
              <p role="alert" className="catalog:m-0 catalog:text-sm">
                Не удалось подтвердить права администратора.
              </p>
            )}
            <div className="catalog:flex catalog:justify-end catalog:gap-2">
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => changeOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={
                  !isAdmin || mutation.isPending || !categories.isSuccess || !categories.data.length
                }
              >
                {mutation.isPending ? "Создаём…" : "Создать"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
