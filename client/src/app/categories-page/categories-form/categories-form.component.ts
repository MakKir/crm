import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Params, Router} from "@angular/router";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {CategoriesService} from "../../shared/services/categories.service";
import {switchMap} from "rxjs/operators";
import {of} from "rxjs";
import {MaterialService} from "../../shared/classes/material.service";
import {Category} from "../../shared/interfaces";

@Component({
  selector: 'app-categories-form',
  templateUrl: './categories-form.component.html',
  styleUrls: ['./categories-form.component.css']
})
export class CategoriesFormComponent implements OnInit {

  @ViewChild('input') inputRef: ElementRef;
  form: FormGroup
  image: File
  isNew = true
  imagePreview = ''
  category: Category

  constructor(private route: ActivatedRoute,
              private categoriesService: CategoriesService,
              private router: Router) { }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(null, Validators.required)
    })

    this.form.disable()

    this.route.params.pipe(
      switchMap(
        (params: Params) => {
          if(params['id']) {

              this.isNew = false
            return this.categoriesService.getById(params['id'])
            }
            return of(null)
        }
      )

    )
      .subscribe(
        (category: Category) => {
          if(category) {
            this.category = category
            this.form.patchValue({
              name: category.name
            });
            this.imagePreview = category.imageSrc
            MaterialService.updateTextInputs()
          }
          this.form.enable()
        },
        error => MaterialService.toast(error.error.message)
      )
  }

  triggerClick() {
    this.inputRef.nativeElement.click()
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];

    this.image = file

    const reader = new FileReader()

    reader.onload = () => {
      this.imagePreview = reader.result
    }

    reader.readAsDataURL(file)
  }

  onSubmit() {
    let obs$
    this.form.disable()
    if(this.isNew) {
      obs$ = this.categoriesService.create(this.form.value.name, this.image)
      console.log(this.image)
    } else {
      obs$ = this.categoriesService.update(this.category._id, this.form.value.name, this.image)
    }

    obs$.subscribe(
      (category: Category) => {
        this.form.enable()
        MaterialService.toast('Изменения сохранены')
        this.category = category
      },
      (error) => {
        this.form.enable()
        MaterialService.toast(error.error.message)
      }
    )
  }

  deleteCategory() {
    const decision = confirm(`Вы уверены, что хотите удалить категорию ${this.category.name}?`)

    if(decision) {
      this.categoriesService.delete(this.category._id)
      .subscribe(
        response => MaterialService.toast(response.message),
        error => MaterialService.toast(error.error.message),
        () => this.router.navigate(['/categories'])
      )
    }
  }

}
