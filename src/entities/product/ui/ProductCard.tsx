import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "../model/product";
import { formatMoney } from "@/shared/lib";
import { Card, CardContent, CardHeader } from "@/shared/ui";

interface Props {
  product: Product;
  detailsHref: string;
  action: ReactNode;
}

export function ProductCard({ product, detailsHref, action }: Props) {
  return (
    <Card className="catalog:flex catalog:h-full catalog:flex-col catalog:min-w-0">
      <CardHeader className="catalog:flex-1">
        <div className="catalog:flex catalog:items-center catalog:justify-between catalog:gap-3 catalog:text-xs catalog:text-muted-foreground">
          <span>{product.category.name}</span>
          {product.badge && (
            <span className="catalog:rounded-full catalog:bg-muted catalog:px-2 catalog:py-1">
              {product.badge}
            </span>
          )}
        </div>
        <h3 className="catalog:m-0 catalog:text-lg catalog:font-semibold catalog:leading-snug">
          <Link
            className="catalog:inline-flex catalog:items-center catalog:gap-2 catalog:text-foreground catalog:underline-offset-4 catalog:hover:underline catalog:focus-visible:outline-2"
            to={detailsHref}
          >
            {product.title}
            <ArrowUpRight aria-hidden="true" size={16} className="catalog:shrink-0" />
          </Link>
        </h3>
        <p className="catalog:m-0 catalog:text-sm catalog:leading-relaxed catalog:text-muted-foreground">
          {product.description}
        </p>
      </CardHeader>
      <CardContent className="catalog:flex catalog:flex-wrap catalog:items-center catalog:justify-between catalog:gap-4">
        <strong className="catalog:text-xl catalog:tracking-tight">
          {formatMoney(product.priceMinor, product.currency)}
        </strong>
        {action}
      </CardContent>
    </Card>
  );
}
